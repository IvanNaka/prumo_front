import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import {
  ROTULO_AVALIACAO_STATUS,
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  ROTULO_TIPO_CRITERIO,
} from '../../../core/models/rotulos';
import { AuthService } from '../../../core/services/auth.service';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import {
  MatrizAvaliacao,
  PriorizacaoService,
  RankingItem,
  ResultadoPriorizacao,
} from '../../../core/services/priorizacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { badgeAvaliacao, badgePrioridade, dataHora, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

type Aba = 'avaliar' | 'ranking';

/** UC10 — avaliar os projetos em cada critério, executar a priorização e analisar o ranking. */
@Component({
  selector: 'app-priorizacao',
  imports: [RouterLink, TemPerfilDirective],
  templateUrl: './priorizacao.html',
  styleUrl: './priorizacao.css',
})
export class Priorizacao {
  private readonly service = inject(PriorizacaoService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly permissoes = PERMISSOES;
  readonly rotuloTipo = ROTULO_TIPO_CRITERIO;
  readonly rotuloAvaliacao = ROTULO_AVALIACAO_STATUS;
  readonly rotuloPrioridade = ROTULO_PRIORIDADE;
  readonly rotuloCategoria = ROTULO_CATEGORIA;
  readonly badgeAvaliacao = badgeAvaliacao;
  readonly badgePrioridade = badgePrioridade;
  readonly num = num;
  readonly dataHora = dataHora;
  readonly notasPossiveis = [1, 2, 3, 4, 5];
  readonly legenda: Record<number, string> = { 1: 'Muito baixo', 2: 'Baixo', 3: 'Médio', 4: 'Alto', 5: 'Muito alto' };

  readonly portfolioId = this.contexto.ativoId;
  readonly encerrado = this.contexto.encerrado;
  readonly podePriorizar = () => this.auth.temPerfil(PERMISSOES.priorizar) && !this.encerrado();

  readonly aba = signal<Aba>('avaliar');
  readonly matriz = signal<MatrizAvaliacao | null>(null);
  readonly resultado = signal<ResultadoPriorizacao | null>(null);
  /** Notas editadas e ainda não salvas: projetoId -> criterioId -> nota. */
  readonly rascunho = signal<Record<string, Record<string, number>>>({});
  readonly executando = signal(false);

  constructor() {
    this.carregarMatriz();
    this.carregarRanking();
  }

  carregarMatriz(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.service.matriz(id).subscribe({
      next: (m) => {
        this.matriz.set(m);
        this.rascunho.set({});
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  carregarRanking(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.service.ranking(id).subscribe({
      next: (r) => this.resultado.set(r),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  nota(projetoId: string, criterioId: string): number | '' {
    const editada = this.rascunho()[projetoId]?.[criterioId];
    if (editada) return editada;
    return this.matriz()?.projetos.find((p) => p.projetoId === projetoId)?.notas[criterioId] ?? '';
  }

  alterarNota(projetoId: string, criterioId: string, valor: string): void {
    const nota = Number(valor);
    this.rascunho.update((r) => ({ ...r, [projetoId]: { ...(r[projetoId] ?? {}), [criterioId]: nota } }));
  }

  temAlteracao(projetoId: string): boolean {
    return Object.keys(this.rascunho()[projetoId] ?? {}).length > 0;
  }

  salvarLinha(projetoId: string): void {
    const notas = Object.entries(this.rascunho()[projetoId] ?? {}).map(([criterioId, nota]) => ({ criterioId, nota }));
    if (notas.length === 0) return;
    this.service.salvarNotas(projetoId, notas).subscribe({
      next: () => {
        this.toast.sucesso('Avaliações salvas.');
        this.carregarMatriz();
        this.carregarRanking(); // F3 pode ter recalculado o ranking
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)), // RN17
    });
  }

  executarPriorizacao(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.executando.set(true);
    this.service.priorizar(id).subscribe({
      next: (r) => {
        this.executando.set(false);
        this.resultado.set(r);
        this.aba.set('ranking');
        this.toast.sucesso('Priorização executada.');
        this.carregarMatriz();
        this.contexto.recarregar(); // Figura 27: -> Priorizado
      },
      error: (e) => {
        this.executando.set(false);
        this.toast.erro(mensagemDeErro(e)); // RN15, RN16, RN22
      },
    });
  }

  decidir(item: RankingItem, acao: 'aprovar' | 'rejeitar'): void {
    this.service.decidir(item.projetoId, acao).subscribe({
      next: () => {
        this.toast.sucesso(acao === 'aprovar' ? 'Projeto aprovado.' : 'Projeto rejeitado.');
        this.carregarRanking();
        this.carregarMatriz();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)), // RN29
    });
  }

  corScore(score: number): string {
    return score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  }
}
