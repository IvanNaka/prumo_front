import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface KeyResult {
  id: string;
  okrId: string;
  descricao: string;
  meta: number;
  valorAtual: number;
  progresso: number;
}

export interface Okr {
  id: string;
  titulo: string;
  descricao?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  progresso: number;
  quantidadeProjetos: number;
  keyResults: KeyResult[];
}

export interface OkrResumo {
  id: string;
  titulo: string;
  progresso: number;
}

export interface SalvarOkr {
  titulo: string;
  descricao?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  keyResults: { id?: string | null; descricao: string; meta: number; valorAtual: number }[];
}

/** OKRs (RF14–RF17, UC8, UC9). */
@Injectable({ providedIn: 'root' })
export class OkrsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  listar(): Observable<Okr[]> {
    return this.http.get<Okr[]>(`${this.api}/okrs`);
  }

  criar(dados: SalvarOkr): Observable<Okr> {
    return this.http.post<Okr>(`${this.api}/okrs`, dados);
  }

  editar(id: string, dados: SalvarOkr): Observable<Okr> {
    return this.http.put<Okr>(`${this.api}/okrs/${id}`, dados);
  }

  atualizarValor(keyResultId: string, valorAtual: number): Observable<KeyResult> {
    return this.http.put<KeyResult>(`${this.api}/key-results/${keyResultId}`, { valorAtual });
  }
}
