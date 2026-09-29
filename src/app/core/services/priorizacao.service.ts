import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AvaliacaoStatus, CategoriaEstrategica, Prioridade, ProjetoStatus, TipoCriterio } from '../models/enums';

export interface RankingItem {
  posicao: number;
  projetoId: string;
  nome: string;
  score: number;
  prioridade: Prioridade;
  categoria: CategoriaEstrategica;
  status: ProjetoStatus;
  statusAvaliacao: AvaliacaoStatus;
}

export interface NaoAvaliado {
  projetoId: string;
  nome: string;
  statusAvaliacao: AvaliacaoStatus;
  criteriosFaltantes: string[];
}

export interface ResultadoPriorizacao {
  dataUltimaPriorizacao: string | null;
  portfolioStatus: string;
  ranking: RankingItem[];
  naoAvaliados: NaoAvaliado[];
}

export interface MatrizAvaliacao {
  criterios: { id: string; nome: string; peso: number; tipo: TipoCriterio }[];
  projetos: {
    projetoId: string;
    nome: string;
    status: ProjetoStatus;
    statusAvaliacao: AvaliacaoStatus;
    scoreAtual: number | null;
    notas: Record<string, number>;
  }[];
}

export interface AvaliacaoProjeto {
  projetoId: string;
  statusAvaliacao: AvaliacaoStatus;
  scoreAtual: number | null;
  posicaoRanking: number | null;
  completa: boolean;
  notas: { criterioId: string; nota: number }[];
}

/** Avaliação, score e ranking (RF18–RF21, UC10). */
@Injectable({ providedIn: 'root' })
export class PriorizacaoService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  matriz(portfolioId: string): Observable<MatrizAvaliacao> {
    return this.http.get<MatrizAvaliacao>(`${this.api}/portfolios/${portfolioId}/avaliacoes`);
  }

  salvarNotas(projetoId: string, notas: { criterioId: string; nota: number }[]): Observable<AvaliacaoProjeto> {
    return this.http.put<AvaliacaoProjeto>(`${this.api}/projetos/${projetoId}/avaliacoes`, notas);
  }

  priorizar(portfolioId: string): Observable<ResultadoPriorizacao> {
    return this.http.post<ResultadoPriorizacao>(`${this.api}/portfolios/${portfolioId}/priorizacao`, null);
  }

  ranking(portfolioId: string): Observable<ResultadoPriorizacao> {
    return this.http.get<ResultadoPriorizacao>(`${this.api}/portfolios/${portfolioId}/ranking`);
  }

  decidir(projetoId: string, acao: 'aprovar' | 'rejeitar'): Observable<AvaliacaoProjeto> {
    return this.http.post<AvaliacaoProjeto>(`${this.api}/projetos/${projetoId}/avaliacao/${acao}`, null);
  }
}
