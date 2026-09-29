import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IntegracaoStatus } from '../models/enums';

/** GET /integracoes/jira — o token nunca é devolvido pela API. */
export interface IntegracaoJira {
  configurada: boolean;
  url: string;
  email: string;
  intervaloSincronizacaoMinutos: number;
  ativo: boolean;
  status: IntegracaoStatus;
  ultimaSincronizacao?: string | null;
  tentativasFalhas: number;
  proximaTentativa?: string | null;
  tokenConfigurado: boolean;
}

export interface SalvarIntegracaoJira {
  url: string;
  email: string;
  /** Em edição, vazio = manter o token atual. */
  apiToken?: string | null;
  intervaloSincronizacaoMinutos: number;
  ativo: boolean;
}

export interface SincronizacaoLog {
  id: string;
  inicio: string;
  fim?: string | null;
  sucesso: boolean;
  issuesProcessadas: number;
  worklogsProcessados: number;
  mensagemErro?: string | null;
}

/** RF47, RF51, UC15, UC16 — integração com o Jira. */
@Injectable({ providedIn: 'root' })
export class IntegracoesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/integracoes/jira`;

  obter(): Observable<IntegracaoJira> {
    return this.http.get<IntegracaoJira>(this.baseUrl);
  }

  salvar(dados: SalvarIntegracaoJira): Observable<IntegracaoJira> {
    return this.http.put<IntegracaoJira>(this.baseUrl, dados);
  }

  testar(): Observable<IntegracaoJira> {
    return this.http.post<IntegracaoJira>(`${this.baseUrl}/testar`, {});
  }

  sincronizar(): Observable<IntegracaoJira> {
    return this.http.post<IntegracaoJira>(`${this.baseUrl}/sincronizar`, {});
  }

  logs(): Observable<SincronizacaoLog[]> {
    return this.http.get<SincronizacaoLog[]>(`${this.baseUrl}/logs`);
  }
}
