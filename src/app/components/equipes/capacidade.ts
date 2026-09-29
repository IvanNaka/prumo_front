import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { RN18 } from '../../core/models/indicadores';
import { mensagemDeErro } from '../../core/models/problem';
import { Capacidade, ClassificacaoOcupacao, EquipesService } from '../../core/services/equipes.service';
import { ToastService } from '../../core/services/toast.service';
import { num } from '../../shared/cores';

/** UC13 / RF32 — capacidade, ocupação e utilização da equipe no mês (F9). */
@Component({
  selector: 'app-capacidade',
  imports: [RouterLink],
  templateUrl: './capacidade.html',
})
export class CapacidadeEquipe {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EquipesService);
  private readonly toast = inject(ToastService);

  readonly rn18 = RN18;
  readonly num = num;
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id')!)), { requireSync: true });
  readonly mes = signal(new Date().toISOString().slice(0, 7));
  readonly resultado = signal<Capacidade | null>(null);

  constructor() {
    this.carregar();
  }

  mudarMes(valor: string): void {
    if (valor) {
      this.mes.set(valor);
      this.carregar();
    }
  }

  carregar(): void {
    this.service.capacidade(this.id(), this.mes()).subscribe({
      next: (r) => this.resultado.set(r),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  /** Cor da barra conforme a classificação do F9. */
  cor(classificacao?: ClassificacaoOcupacao | null): string {
    switch (classificacao) {
      case 'Sobrecarregada':
        return 'red';
      case 'Adequada':
        return 'green';
      default:
        return 'yellow';
    }
  }

  badge(classificacao?: ClassificacaoOcupacao | null): string {
    switch (classificacao) {
      case 'Sobrecarregada':
        return 'badge badge-red';
      case 'Adequada':
        return 'badge badge-green';
      default:
        return 'badge badge-yellow';
    }
  }

  largura(valor: number): number {
    return Math.min(100, Math.max(0, valor));
  }
}
