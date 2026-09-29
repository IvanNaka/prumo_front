import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Role } from '../models/enums';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfis: Role[];
  ativo: boolean;
  dataCriacao: string;
}

export interface SalvarUsuario {
  nome: string;
  email?: string;
  perfis: Role[];
}

/** RF03 — /api/usuarios (somente Administrador). */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  criar(dados: SalvarUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, dados);
  }

  editar(id: string, dados: SalvarUsuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, { nome: dados.nome, perfis: dados.perfis });
  }

  definirAtivo(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/ativo`, { ativo });
  }
}
