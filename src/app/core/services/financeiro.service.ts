import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TipoLancamento } from '../models/enums';
import { IndicadoresProjeto } from '../models/indicadores';

export interface Lancamento {
  id: string;
  projetoId: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  dataLancamento: string;
}

export interface FluxoCaixa {
  mes: number;
  valor: number;
}

export interface BusinessCase {
  id?: string | null;
  projetoId: string;
  cadastrado: boolean;
  investimentoInicial: number;
  taxaDescontoAnual: number;
  fluxosPrevistos: FluxoCaixa[];
}

export interface Retorno {
  id: string;
  projetoId: string;
  data: string;
  valor: number;
  descricao?: string | null;
}

export interface SalvarLancamento {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  dataLancamento: string;
}

/** Financeiro do projeto (RF22–RF25) e indicadores do projeto. */
@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  lancamentos(projetoId: string): Observable<Lancamento[]> {
    return this.http.get<Lancamento[]>(`${this.api}/projetos/${projetoId}/lancamentos`);
  }

  criarLancamento(projetoId: string, dados: SalvarLancamento): Observable<Lancamento> {
    return this.http.post<Lancamento>(`${this.api}/projetos/${projetoId}/lancamentos`, dados);
  }

  excluirLancamento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/lancamentos/${id}`);
  }

  businessCase(projetoId: string): Observable<BusinessCase> {
    return this.http.get<BusinessCase>(`${this.api}/projetos/${projetoId}/business-case`);
  }

  salvarBusinessCase(
    projetoId: string,
    dados: { investimentoInicial: number; taxaDescontoAnual: number; fluxosPrevistos: FluxoCaixa[] }
  ): Observable<BusinessCase> {
    return this.http.put<BusinessCase>(`${this.api}/projetos/${projetoId}/business-case`, dados);
  }

  retornos(projetoId: string): Observable<Retorno[]> {
    return this.http.get<Retorno[]>(`${this.api}/projetos/${projetoId}/retornos`);
  }

  criarRetorno(projetoId: string, dados: { data: string; valor: number; descricao?: string | null }): Observable<Retorno> {
    return this.http.post<Retorno>(`${this.api}/projetos/${projetoId}/retornos`, dados);
  }

  indicadoresProjeto(projetoId: string): Observable<IndicadoresProjeto> {
    return this.http.get<IndicadoresProjeto>(`${this.api}/projetos/${projetoId}/indicadores`);
  }
}
