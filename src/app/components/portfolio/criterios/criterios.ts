import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Criterio } from '../../../core/models/criterio';
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

  readonly somaPesos = computed(() => this.criterios().reduce((total, c) => total + c.peso, 0));

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
    this.form.reset({ nome: '', descricao: '', peso: 1, tipo: 'Beneficio' });
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

  salvar(): void {
    if (this.form.invalid) {
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
