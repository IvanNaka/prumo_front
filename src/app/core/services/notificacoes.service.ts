import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NotificacaoStatus, TipoNotificacao } from '../models/enums';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
  entidadeTipo?: 'Projeto' | 'Equipe' | 'Dependencia' | 'Integracao' | null;
  entidadeId?: string | null;
  projetoId?: string | null;
  status: NotificacaoStatus;
  dataCriacao: string;
  dataEnvio?: string | null;
  dataLeitura?: string | null;
  dataArquivamento?: string | null;
}

/** Central de notificações (RF45, RF46). Cada usuário vê apenas as próprias. */
@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notificacoes`;

  /** Contagem de não lidas (sino do cabeçalho). */
  readonly naoLidas = signal(0);

  listar(status: NotificacaoStatus[] = [], tipos: TipoNotificacao[] = []): Observable<Notificacao[]> {
    let params = new HttpParams();
    if (status.length) params = params.set('status', status.join(','));
    if (tipos.length) params = params.set('tipo', tipos.join(','));
    return this.http.get<Notificacao[]>(this.baseUrl, { params });
  }

  atualizarContagem(): void {
    this.http.get<{ quantidade: number }>(`${this.baseUrl}/nao-lidas/contagem`).subscribe({
      next: (r) => this.naoLidas.set(r.quantidade),
      error: () => undefined,
    });
  }

  marcarLida(id: string): Observable<Notificacao> {
    return this.http.patch<Notificacao>(`${this.baseUrl}/${id}/lida`, {}).pipe(tap(() => this.atualizarContagem()));
  }

  arquivar(id: string): Observable<Notificacao> {
    return this.http.patch<Notificacao>(`${this.baseUrl}/${id}/arquivar`, {}).pipe(tap(() => this.atualizarContagem()));
  }
}
