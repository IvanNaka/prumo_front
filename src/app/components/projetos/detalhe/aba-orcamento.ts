import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TIPOS_LANCAMENTO, TipoLancamento } from '../../../core/models/enums';
import { BurnRate, RN18 } from '../../../core/models/indicadores';
import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_TIPO_LANCAMENTO } from '../../../core/models/rotulos';
import { FinanceiroService, Lancamento } from '../../../core/services/financeiro.service';
import { ToastService } from '../../../core/services/toast.service';
import { brl, data, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** Aba "Orçamento" do projeto (RF22–RF24, F5): cartões do Burn Rate e lançamentos. */
@Component({
  selector: 'app-aba-orcamento',
  imports: [ReactiveFormsModule, TemPerfilDirective],
  templateUrl: './aba-orcamento.html',
})
export class AbaOrcamento implements OnInit {
  private readonly service = inject(FinanceiroService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly projetoId = input.required<string>();
  readonly editavel = input(true);

  readonly permissoes = PERMISSOES;
  readonly tipos = TIPOS_LANCAMENTO;
  readonly rotuloTipo = ROTULO_TIPO_LANCAMENTO;
  readonly rn18 = RN18;
  readonly brl = brl;
  readonly num = num;
  readonly data = data;
  readonly hoje = new Date().toISOString().slice(0, 10);

  readonly burnRate = signal<BurnRate | null>(null);
  readonly lancamentos = signal<Lancamento[]>([]);
  readonly formAberto = signal(false);
  readonly salvando = signal(false);

  readonly form = this.fb.nonNullable.group({
    descricao: ['', [Validators.required, Validators.maxLength(300)]],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    tipo: ['Custo' as TipoLancamento, [Validators.required]],
    dataLancamento: [this.hoje, [Validators.required]],
  });

  largura(percentual: number | null): number {
    return Math.min(100, Math.max(0, percentual ?? 0));
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.service.indicadoresProjeto(this.projetoId()).subscribe({
      next: (i) => this.burnRate.set(i.burnRate),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.service.lancamentos(this.projetoId()).subscribe({
      next: (lista) => this.lancamentos.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  novo(): void {
    this.form.reset({ descricao: '', valor: 0, tipo: 'Custo', dataLancamento: this.hoje });
    this.formAberto.set(true);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.service.criarLancamento(this.projetoId(), this.form.getRawValue()).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso('Lançamento registrado.');
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e)); // RN28
      },
    });
  }

  excluir(lancamento: Lancamento): void {
    this.service.excluirLancamento(lancamento.id).subscribe({
      next: () => {
        this.toast.sucesso('Lançamento excluído.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
