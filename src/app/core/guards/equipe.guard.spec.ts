import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { comEquipeGuard, semEquipeGuard } from './equipe.guard';

function sessao(perfis: string[]): void {
  sessionStorage.setItem('prumo_token', 'jwt');
  sessionStorage.setItem('prumo_expira_em', new Date(Date.now() + 3600_000).toISOString());
  sessionStorage.setItem('prumo_usuario', JSON.stringify({ id: '1', nome: 'Ana', email: 'ana@x', perfis }));
}

function executar(guard: typeof comEquipeGuard): true | string {
  const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : (result as true);
}

describe('guards de equipe (primeiro acesso)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  });

  it('usuário sem perfil é levado para /boas-vindas', () => {
    sessao([]);
    expect(executar(comEquipeGuard)).toBe('/boas-vindas');
    expect(executar(semEquipeGuard)).toBe(true);
  });

  it('usuário com perfil não fica na tela de boas-vindas', () => {
    sessao(['Desenvolvedor']);
    expect(executar(comEquipeGuard)).toBe(true);
    expect(executar(semEquipeGuard)).toBe('/');
  });

  it('sem login, /boas-vindas volta para /login', () => {
    expect(executar(semEquipeGuard)).toBe('/login');
  });
});
