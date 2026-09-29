import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CategoriaEstrategica, ProjetoStatus } from '../models/enums';
import { ProjetoResumo } from '../models/projeto';

/** Projetos (RF10–RF13, UC7). */
@Injectable({ providedIn: 'root' })
export class ProjetosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  listar(portfolioId: string, filtros: { status?: ProjetoStatus | ''; categoria?: CategoriaEstrategica | '' } = {}): Observable<ProjetoResumo[]> {
    let params = new HttpParams();
    if (filtros.status) {
      params = params.set('status', filtros.status);
    }
    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    return this.http.get<ProjetoResumo[]>(`${this.api}/portfolios/${portfolioId}/projetos`, { params });
  }
}
