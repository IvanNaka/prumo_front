import { Component, effect, inject, input, signal } from '@angular/core';

import { ClassificacaoSaude, IndicadoresProjeto, RN18 } from '../../../core/models/indicadores';
import { mensagemDeErro } from '../../../core/models/problem';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { ToastService } from '../../../core/services/toast.service';
import { data, num } from '../../../shared/cores';

/** Aba "Indicadores" do projeto: saúde com flags (F12), progresso das issues, lead time (F7) e qualidade (F8). */
@Component({
  selector: 'app-aba-indicadores',
  templateUrl: './aba-indicadores.html',
})
export class AbaIndicadores {
  private readonly service = inject(FinanceiroService);
  private readonly toast = inject(ToastService);

  readonly projetoId = input.required<string>();

  readonly rn18 = RN18;
  readonly num = num;
  readonly data = data;
  readonly indicadores = signal<IndicadoresProjeto | null>(null);

  constructor() {
    effect(() => {
      this.service.indicadoresProjeto(this.projetoId()).subscribe({
        next: (i) => this.indicadores.set(i),
        error: (e) => this.toast.erro(mensagemDeErro(e)),
      });
    });
  }

  badgeSaude(classificacao?: ClassificacaoSaude | null): string {
    switch (classificacao) {
      case 'Saudável':
        return 'badge badge-green';
      case 'Atenção':
        return 'badge badge-yellow';
      default:
        return 'badge badge-red';
    }
  }

  largura(valor: number | null | undefined): number {
    return Math.min(100, Math.max(0, valor ?? 0));
  }
}
