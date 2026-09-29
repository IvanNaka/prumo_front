import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ProjetoStatus } from '../models/enums';

export interface Dependencia {
  id: string;
  portfolioId: string;
  projetoOrigemId: string;
  projetoOrigemNome: string;
  projetoOrigemStatus: ProjetoStatus;
  projetoDestinoId: string;
  projetoDestinoNome: string;
  projetoDestinoStatus: ProjetoStatus;
  descricao?: string | null;
  emRisco: boolean;
  motivo?: string | null;
}

/** Dependências entre projetos (RF26–RF28, UC12). */
@Injectable({ providedIn: 'root' })
export class DependenciasService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  doPortfolio(portfolioId: string): Observable<Dependencia[]> {
    return this.http.get<Dependencia[]>(`${this.api}/portfolios/${portfolioId}/dependencias`);
  }

  criar(dados: { projetoOrigemId: string; projetoDestinoId: string; descricao?: string | null }): Observable<Dependencia> {
    return this.http.post<Dependencia>(`${this.api}/dependencias`, dados);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/dependencias/${id}`);
  }
}
