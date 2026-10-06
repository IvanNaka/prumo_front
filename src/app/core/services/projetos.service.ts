import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CategoriaEstrategica, ProjetoStatus } from '../models/enums';
import { AcaoProjeto, ProjetoDetalhe, ProjetoResumo, SalvarProjeto } from '../models/projeto';

/** Projetos (RF10–RF13, UC7). */
@Injectable({ providedIn: 'root' })
export class ProjetosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  listar(
    portfolioId: string,
    filtros: { status?: ProjetoStatus | ''; categoria?: CategoriaEstrategica | '' } = {}
  ): Observable<ProjetoResumo[]> {
    let params = new HttpParams();
    if (filtros.status) {
      params = params.set('status', filtros.status);
    }
    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    return this.http.get<ProjetoResumo[]>(`${this.api}/portfolios/${portfolioId}/projetos`, { params });
  }

  obter(id: string): Observable<ProjetoDetalhe> {
    return this.http.get<ProjetoDetalhe>(`${this.api}/projetos/${id}`);
  }

  criar(portfolioId: string, dados: SalvarProjeto): Observable<ProjetoDetalhe> {
    return this.http.post<ProjetoDetalhe>(`${this.api}/portfolios/${portfolioId}/projetos`, dados);
  }

  editar(id: string, dados: SalvarProjeto): Observable<ProjetoDetalhe> {
    return this.http.put<ProjetoDetalhe>(`${this.api}/projetos/${id}`, dados);
  }

  alterarStatus(id: string, acao: AcaoProjeto): Observable<ProjetoDetalhe> {
    return this.http.post<ProjetoDetalhe>(`${this.api}/projetos/${id}/status`, { acao });
  }

  alocarEquipe(id: string, equipeId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/projetos/${id}/equipes/${equipeId}`, null);
  }

  desalocarEquipe(id: string, equipeId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/projetos/${id}/equipes/${equipeId}`);
  }
}
