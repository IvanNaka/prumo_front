import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Criterio, SalvarCriterio } from '../models/criterio';

/** Critérios de priorização (RF07–RF09, UC4–UC6). */
@Injectable({ providedIn: 'root' })
export class CriteriosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  listar(portfolioId: string): Observable<Criterio[]> {
    return this.http.get<Criterio[]>(`${this.api}/portfolios/${portfolioId}/criterios`);
  }

  criar(portfolioId: string, dados: SalvarCriterio): Observable<Criterio> {
    return this.http.post<Criterio>(`${this.api}/portfolios/${portfolioId}/criterios`, dados);
  }

  editar(id: string, dados: SalvarCriterio): Observable<Criterio> {
    return this.http.put<Criterio>(`${this.api}/criterios/${id}`, dados);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/criterios/${id}`);
  }
}
