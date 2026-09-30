import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Indicador } from '../models/indicadores';

export interface MembroEquipe {
  id: string;
  equipeId: string;
  usuarioId?: string | null;
  nome: string;
  email: string;
  custoHora: number;
  capacidadeMensalHoras: number;
}

export interface Equipe {
  id: string;
  nome: string;
  portfolioId?: string | null;
  portfolioNome?: string | null;
  capacidadeMensalTotal: number;
  /** Só vem preenchido para quem pode editar equipes. */
  codigoConvite?: string | null;
  membros: MembroEquipe[];
}

export type ClassificacaoOcupacao = 'Subutilizada' | 'Adequada' | 'Sobrecarregada';

/** F9 — capacidade, ocupação e utilização. */
export interface Capacidade extends Indicador {
  equipeId?: string | null;
  equipeNome?: string | null;
  membroId?: string | null;
  membroNome?: string | null;
  mes: string;
  capacidade: number;
  demanda: number;
  ocupacao: number;
  horasMes: number;
  utilizacao: number;
  classificacao?: ClassificacaoOcupacao | null;
  membros?: Capacidade[] | null;
  equipes?: Capacidade[] | null;
}

export interface SalvarMembro {
  usuarioId?: string | null;
  nome: string;
  email: string;
  custoHora: number;
  capacidadeMensalHoras: number;
}

/** Equipes, membros e capacidade (RF29–RF32, UC13). */
@Injectable({ providedIn: 'root' })
export class EquipesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/equipes`;

  listar(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(this.baseUrl);
  }

  obter(id: string): Observable<Equipe> {
    return this.http.get<Equipe>(`${this.baseUrl}/${id}`);
  }

  criar(dados: { nome: string; portfolioId?: string | null }): Observable<Equipe> {
    return this.http.post<Equipe>(this.baseUrl, dados);
  }

  editar(id: string, dados: { nome: string; portfolioId?: string | null }): Observable<Equipe> {
    return this.http.put<Equipe>(`${this.baseUrl}/${id}`, dados);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Gera um novo código de convite; o anterior deixa de valer. */
  gerarCodigoConvite(id: string): Observable<Equipe> {
    return this.http.post<Equipe>(`${this.baseUrl}/${id}/codigo-convite`, {});
  }

  adicionarMembro(equipeId: string, dados: SalvarMembro): Observable<MembroEquipe> {
    return this.http.post<MembroEquipe>(`${this.baseUrl}/${equipeId}/membros`, dados);
  }

  editarMembro(equipeId: string, membroId: string, dados: SalvarMembro): Observable<MembroEquipe> {
    return this.http.put<MembroEquipe>(`${this.baseUrl}/${equipeId}/membros/${membroId}`, dados);
  }

  removerMembro(equipeId: string, membroId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${equipeId}/membros/${membroId}`);
  }

  capacidade(equipeId: string, mes: string): Observable<Capacidade> {
    return this.http.get<Capacidade>(`${this.baseUrl}/${equipeId}/capacidade`, { params: new HttpParams().set('mes', mes) });
  }
}
