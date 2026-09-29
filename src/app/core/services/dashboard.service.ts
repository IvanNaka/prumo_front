import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Dashboard } from '../models/indicadores';

/** RF35–RF42, UC11 — os 8 indicadores do portfólio (calculados na API; o front só exibe). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  obter(portfolioId: string, de?: string, ate?: string): Observable<Dashboard> {
    let params = new HttpParams();
    if (de) params = params.set('de', de);
    if (ate) params = params.set('ate', ate);
    return this.http.get<Dashboard>(`${this.api}/portfolios/${portfolioId}/dashboard`, { params });
  }
}
