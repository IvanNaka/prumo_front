import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type TipoRelatorio = 'portfolio' | 'executivo';
export type FormatoRelatorio = 'pdf' | 'excel';

export interface RelatorioHistorico {
  id: string;
  nome: string;
  tipo: 'Portfolio' | 'Executivo';
  formato: 'PDF' | 'Excel';
  geradoPorId: string;
  geradoPorNome: string;
  dataGeracao: string;
}

/** Relatórios PDF e Excel (RF43, RF44). */
@Injectable({ providedIn: 'root' })
export class RelatoriosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  gerar(portfolioId: string, tipo: TipoRelatorio, formato: FormatoRelatorio): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.api}/portfolios/${portfolioId}/relatorios/${tipo}`, {
      params: { formato },
      responseType: 'blob',
      observe: 'response',
    });
  }

  historico(portfolioId: string): Observable<RelatorioHistorico[]> {
    return this.http.get<RelatorioHistorico[]>(`${this.api}/portfolios/${portfolioId}/relatorios/historico`);
  }
}
