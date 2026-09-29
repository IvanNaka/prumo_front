import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AcaoPortfolio, MembroPortfolio, Portfolio, SalvarPortfolio } from '../models/portfolio';

/** /api/portfolios (RF04–RF06, Figura 27). */
@Injectable({ providedIn: 'root' })
export class PortfoliosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/portfolios`;

  listar(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(this.baseUrl);
  }

  obter(id: string): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.baseUrl}/${id}`);
  }

  criar(dados: SalvarPortfolio): Observable<Portfolio> {
    return this.http.post<Portfolio>(this.baseUrl, dados);
  }

  editar(id: string, dados: SalvarPortfolio): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${this.baseUrl}/${id}`, dados);
  }

  executarAcao(id: string, acao: AcaoPortfolio): Observable<Portfolio> {
    return this.http.post<Portfolio>(`${this.baseUrl}/${id}/acoes/${acao}`, null);
  }

  membros(id: string): Observable<MembroPortfolio[]> {
    return this.http.get<MembroPortfolio[]>(`${this.baseUrl}/${id}/membros`);
  }

  adicionarMembro(id: string, usuarioId: string): Observable<MembroPortfolio[]> {
    return this.http.post<MembroPortfolio[]>(`${this.baseUrl}/${id}/membros`, { usuarioId });
  }

  removerMembro(id: string, usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/membros/${usuarioId}`);
  }
}
