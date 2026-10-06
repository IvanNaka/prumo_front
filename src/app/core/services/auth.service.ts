import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, UsuarioSessao } from '../models/auth';
import { Role } from '../models/enums';

const TOKEN_KEY = 'prumo_token';
const USUARIO_KEY = 'prumo_usuario';
const EXPIRA_KEY = 'prumo_expira_em';

/**
 * Sessão do usuário (UC1 / D01): login pelo Google, JWT próprio do Prumo guardado no
 * sessionStorage junto com os dados do usuário.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly usuarioAtual = signal<UsuarioSessao | null>(this.lerUsuario());

  readonly usuario = this.usuarioAtual.asReadonly();
  readonly perfis = computed<Role[]>(() => this.usuarioAtual()?.perfis ?? []);
  /** Logado mas ainda sem perfil: só acessa a tela de entrar em uma equipe ou criar uma. */
  readonly semEquipe = computed(() => this.usuarioAtual() !== null && this.perfis().length === 0);

  /** POST /api/auth/google — troca o ID token do Google pelo JWT do Prumo. */
  loginGoogle(idToken: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/google`, { idToken })
      .pipe(tap((response) => this.salvarSessao(response)));
  }

  /** POST /api/onboarding/equipes — cria a equipe; o usuário vira TechLead (novo JWT). */
  criarEquipe(nome: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/onboarding/equipes`, { nome })
      .pipe(tap((response) => this.salvarSessao(response)));
  }

  /**
   * POST /api/onboarding/entrar — entra na equipe pelo código de convite (novo JWT). No primeiro
   * acesso o usuário vira Desenvolvedor; quem já tem perfil entra em mais uma equipe e mantém o perfil.
   */
  entrarNaEquipe(codigo: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/onboarding/entrar`, { codigo })
      .pipe(tap((response) => this.salvarSessao(response)));
  }

  /** GET /api/auth/me — atualiza os dados (e perfis) do usuário logado. */
  atualizarUsuario(): Observable<UsuarioSessao> {
    return this.http.get<UsuarioSessao>(`${this.baseUrl}/me`).pipe(
      tap((usuario) => {
        sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
        this.usuarioAtual.set(usuario);
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getUserId(): string | null {
    return this.usuarioAtual()?.id ?? null;
  }

  /** Há token e ele ainda não expirou. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const expiraEm = sessionStorage.getItem(EXPIRA_KEY);
    const expiracao = expiraEm ? Date.parse(expiraEm) : this.expiracaoDoJwt(token);
    return !expiracao || expiracao > Date.now();
  }

  /** Compatibilidade com componentes antigos. */
  hasToken(): boolean {
    return this.isAuthenticated();
  }

  /** O usuário tem ao menos um dos perfis (o Administrador tem acesso a tudo). */
  temPerfil(perfis: readonly Role[]): boolean {
    const meus = this.perfis();
    if (meus.includes('Administrador')) {
      return true;
    }
    return perfis.some((perfil) => meus.includes(perfil));
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USUARIO_KEY);
    sessionStorage.removeItem(EXPIRA_KEY);
    sessionStorage.removeItem('portfolioAtivoId');
    this.usuarioAtual.set(null);
  }

  /** Compatibilidade com componentes antigos. */
  clearToken(): void {
    this.logout();
  }

  private salvarSessao(response: LoginResponse): void {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(EXPIRA_KEY, response.expiraEm);
    sessionStorage.setItem(USUARIO_KEY, JSON.stringify(response.usuario));
    this.usuarioAtual.set(response.usuario);
  }

  private lerUsuario(): UsuarioSessao | null {
    try {
      const raw = sessionStorage.getItem(USUARIO_KEY);
      return raw ? (JSON.parse(raw) as UsuarioSessao) : null;
    } catch {
      return null;
    }
  }

  private expiracaoDoJwt(token: string): number | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(globalThis.atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')));
      return typeof json.exp === 'number' ? json.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
