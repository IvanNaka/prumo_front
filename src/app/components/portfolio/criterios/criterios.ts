import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Criterio, SOMA_PESOS } from '../../../core/models/criterio';
import { TIPOS_CRITERIO, TipoCriterio } from '../../../core/models/enums';
import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_TIPO_CRITERIO } from '../../../core/models/rotulos';
import { CriteriosService } from '../../../core/services/criterios.service';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** UC4–UC6 / RF07–RF09 — critérios de priorização do portfólio ativo. */
@Component({
  selector: 'app-criterios',
  imports: [ReactiveFormsModule, TemPerfilDirective, ConfirmDialog],
  templateUrl: './criterios.html',
})
export class Criterios {
  private readonly service = inject(CriteriosService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly permissoes = PERMISSOES;
  readonly tipos = TIPOS_CRITERIO;
  readonly rotuloTipo = ROTULO_TIPO_CRITERIO;
  readonly descricaoTipo: Record<TipoCriterio, string> = {
    Beneficio: 'Benefício — quanto maior, melhor',
    Custo: 'Custo — quanto menor, melhor',
  };
  readonly num = num;

  readonly portfolio = this.contexto.ativo;
  readonly encerrado = this.contexto.encerrado;
  readonly criterios = signal<Criterio[]>([]);
  readonly carregando = signal(true);
  readonly formAberto = signal(false);
  readonly editando = signal<Criterio | null>(null);
  readonly excluindo = signal<Criterio | null>(null);
  readonly salvando = signal(false);

  readonly somaMaxima = SOMA_PESOS;
  readonly somaPesos = computed(() => somar(this.criterios().map((c) => c.peso)));
  readonly somaCompleta = computed(() => this.somaPesos() === SOMA_PESOS);
  /** Peso ainda disponível para o critério do formulário (desconta os demais critérios). */
  readonly pesoDisponivel = computed(() => {
    const editando = this.editando();
    const outros = somar(this.criterios().filter((c) => c.id !== editando?.id).map((c) => c.peso));
    return arredondar(SOMA_PESOS - outros);
  });

  /** Modal "Ajustar pesos": edita todos os pesos de uma vez, exigindo soma 10. */
  readonly ajustandoPesos = signal(false);
  readonly pesosAjuste = signal<Record<string, number>>({});
  readonly somaAjuste = computed(() => somar(Object.values(this.pesosAjuste())));
  readonly ajusteValido = computed(
    () =>
      this.somaAjuste() === SOMA_PESOS &&
      Object.values(this.pesosAjuste()).every((p) => p > 0 && p <= SOMA_PESOS),
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    peso: [1, [Validators.required, Validators.min(0.01), Validators.max(10)]],
    tipo: ['Beneficio' as TipoCriterio, [Validators.required]],
  });

  constructor() {
    this.carregar();
  }

  carregar(): void {
    const id = this.contexto.ativoId();
    if (!id) {
      return;
    }
    this.carregando.set(true);
    this.service.listar(id).subscribe({
      next: (lista) => {
        this.criterios.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  novo(): void {
    this.editando.set(null);
    // Sugere o peso que falta para completar 10.
    this.form.reset({ nome: '', descricao: '', peso: Math.max(this.pesoDisponivel(), 0), tipo: 'Beneficio' });
    this.formAberto.set(true);
  }

  editar(criterio: Criterio): void {
    this.editando.set(criterio);
    this.form.reset({
      nome: criterio.nome,
      descricao: criterio.descricao ?? '',
      peso: criterio.peso,
      tipo: criterio.tipo ?? 'Beneficio',
    });
    this.formAberto.set(true);
  }

  /** O peso informado faz a soma dos pesos passar de 10? */
  excedeSoma(): boolean {
    return arredondar(this.form.controls.peso.value) > this.pesoDisponivel();
  }

  salvar(): void {
    if (this.form.invalid || this.excedeSoma()) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = this.form.getRawValue();
    const editando = this.editando();
    const req = editando
      ? this.service.editar(editando.id, dados)
      : this.service.criar(this.contexto.ativoId()!, dados);
    this.salvando.set(true);
    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(editando ? 'Critério atualizado com sucesso.' : 'Critério cadastrado com sucesso.');
        this.carregar();
        this.contexto.recarregar(); // o status do portfólio pode mudar (Figura 27)
      },
      error: (e) => {
        this.salvando.set(false);
        // RN07, RN08, RN09, RN10
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  abrirAjustePesos(): void {
    this.pesosAjuste.set(Object.fromEntries(this.criterios().map((c) => [c.id, c.peso])));
    this.ajustandoPesos.set(true);
  }

  definirPesoAjuste(id: string, valor: string): void {
    const peso = arredondar(Number(valor.replace(',', '.')) || 0);
    this.pesosAjuste.update((pesos) => ({ ...pesos, [id]: peso }));
  }

  /** Mantém a proporção entre os pesos atuais, escalando para somar exatamente 10. */
  distribuirProporcionalmente(): void {
    const ids = this.criterios().map((c) => c.id);
    if (ids.length === 0) {
      return;
    }
    const atuais = this.pesosAjuste();
    const soma = somar(ids.map((id) => atuais[id] ?? 0));
    const base = soma > 0 ? ids.map((id) => (atuais[id] ?? 0) / soma) : ids.map(() => 1 / ids.length);
    const centavos = base.map((b) => Math.max(1, Math.floor(b * SOMA_PESOS * 100)));
    // Distribui o resto (em centésimos) para fechar exatamente 10.
    let resto = SOMA_PESOS * 100 - centavos.reduce((t, c) => t + c, 0);
    for (let i = 0; resto !== 0 && ids.length > 0; i = (i + 1) % ids.length) {
      if (resto > 0) {
        centavos[i]++;
        resto--;
      } else if (centavos[i] > 1) {
        centavos[i]--;
        resto++;
      }
    }
    this.pesosAjuste.set(Object.fromEntries(ids.map((id, i) => [id, centavos[i] / 100])));
  }

  salvarPesos(): void {
    if (!this.ajusteValido()) {
      return;
    }
    const pesos = Object.entries(this.pesosAjuste()).map(([criterioId, peso]) => ({ criterioId, peso }));
    this.salvando.set(true);
    this.service.atualizarPesos(this.contexto.ativoId()!, pesos).subscribe({
      next: (lista) => {
        this.salvando.set(false);
        this.ajustandoPesos.set(false);
        this.criterios.set(lista);
        this.toast.sucesso('Pesos atualizados com sucesso.');
        this.contexto.recarregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  confirmarExclusao(): void {
    const criterio = this.excluindo();
    this.excluindo.set(null);
    if (!criterio) {
      return;
    }
    this.service.excluir(criterio.id).subscribe({
      next: () => {
        this.toast.sucesso('Critério excluído com sucesso.');
        this.carregar();
        this.contexto.recarregar();
      },
      // RN11: "Critério associado a avaliações não pode ser excluído."
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}

/** Arredonda para 2 casas, evitando erros de ponto flutuante (ex.: 0,1 + 0,2). */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function somar(valores: number[]): number {
  return arredondar(valores.reduce((total, v) => total + Math.round(v * 100), 0) / 100);
}
