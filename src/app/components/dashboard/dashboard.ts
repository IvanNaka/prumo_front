import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { CapacidadeIndicador, ClassificacaoSaude, Dashboard as DashboardDados, RN18 } from '../../core/models/indicadores';
import { mensagemDeErro } from '../../core/models/problem';
import { ROTULO_PRIORIDADE } from '../../core/models/rotulos';
import { DashboardService } from '../../core/services/dashboard.service';
import { PortfolioContextService } from '../../core/services/portfolio-context.service';
import { PriorizacaoService, RankingItem } from '../../core/services/priorizacao.service';
import { ToastService } from '../../core/services/toast.service';
import { badgePrioridade, brl, dataHora, num } from '../../shared/cores';

const CORES_SAUDE: Record<ClassificacaoSaude, string> = { Saudável: '#16a34a', Atenção: '#f59e0b', Crítico: '#dc2626' };
const CORES_CATEGORIA: Record<string, string> = { Run: '#64748b', Grow: '#2563eb', Transform: '#7c3aed' };

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** UC11 — dashboard do portfólio: 8 cartões, um por indicador (ordem do roteiro do Cap. 4). */
@Component({
  selector: 'app-dashboard',
  imports: [BaseChartDirective, RouterLink],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly service = inject(DashboardService);
  private readonly priorizacao = inject(PriorizacaoService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);

  readonly rn18 = RN18;
  readonly num = num;
  readonly brl = brl;
  readonly dataHora = dataHora;
  readonly badgePrioridade = badgePrioridade;
  readonly rotuloPrioridade = ROTULO_PRIORIDADE;

  readonly portfolioId = this.contexto.ativoId;
  readonly de = signal(isoDia(new Date(Date.now() - 90 * 86_400_000)));
  readonly ate = signal(isoDia(new Date()));
  readonly dados = signal<DashboardDados | null>(null);
  readonly top5 = signal<RankingItem[]>([]);
  readonly carregando = signal(false);

  readonly criticos = computed(() => (this.dados()?.saude.projetos ?? []).filter((p) => p.classificacao === 'Crítico'));

  readonly roscaSaude = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    const s = this.dados()?.saude;
    if (!s?.disponivel) return null;
    const rotulos = Object.keys(CORES_SAUDE) as ClassificacaoSaude[];
    return {
      labels: rotulos,
      datasets: [{ data: rotulos.map((r) => s.contagem[r] ?? 0), backgroundColor: rotulos.map((r) => CORES_SAUDE[r]) }],
    };
  });

  readonly roscaAlocacao = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    const a = this.dados()?.alocacaoEstrategica;
    if (!a?.disponivel) return null;
    return {
      labels: a.categorias.map((c) => `${c.categoria} (${num(c.percentualOrcamento)}%)`),
      datasets: [
        {
          data: a.categorias.map((c) => c.percentualOrcamento),
          backgroundColor: a.categorias.map((c) => CORES_CATEGORIA[c.categoria] ?? '#94a3b8'),
        },
      ],
    };
  });

  readonly barrasVpl = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const v = this.dados()?.vpl;
    if (!v?.disponivel) return null;
    const projetos = v.projetos ?? [];
    return {
      labels: projetos.map((p) => p.projetoNome ?? ''),
      datasets: [
        { label: 'VPL esperado', data: projetos.map((p) => p.vplEsperado), backgroundColor: '#94a3b8' },
        { label: 'VPL realizado', data: projetos.map((p) => p.vplRealizado), backgroundColor: '#2563eb' },
      ],
    };
  });

  readonly opcoesRosca: ChartConfiguration<'doughnut'>['options'] = {
    locale: 'pt-BR',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  readonly opcoesBarras: ChartConfiguration<'bar'>['options'] = {
    locale: 'pt-BR',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  constructor() {
    this.carregar();
  }

  mudarPeriodo(campo: 'de' | 'ate', valor: string): void {
    if (!valor) return;
    this[campo].set(valor);
    this.carregar();
  }

  carregar(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.carregando.set(true);
    this.service.obter(id, this.de(), this.ate()).subscribe({
      next: (d) => {
        this.dados.set(d);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
    this.priorizacao.ranking(id).subscribe({ next: (r) => this.top5.set(r.ranking.slice(0, 5)) });
  }

  corSaude(classificacao?: ClassificacaoSaude | null): string {
    switch (classificacao) {
      case 'Saudável':
        return 'text-success';
      case 'Atenção':
        return 'text-warning';
      default:
        return 'text-danger';
    }
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

  corOcupacao(c: CapacidadeIndicador): string {
    switch (c.classificacao) {
      case 'Sobrecarregada':
        return 'progress red';
      case 'Adequada':
        return 'progress green';
      default:
        return 'progress yellow';
    }
  }

  largura(valor: number | null | undefined): number {
    return Math.min(100, Math.max(0, valor ?? 0));
  }
}
