import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('grava token e usuário no sessionStorage após o login Google', () => {
    const expiraEm = new Date(Date.now() + 3600_000).toISOString();
    service.loginGoogle('id-token').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/auth/google'));
    expect(req.request.body).toEqual({ idToken: 'id-token' });
    req.flush({ token: 'jwt', expiraEm, usuario: { id: '1', nome: 'Ana', email: 'ana@x', perfis: ['ProductOwner'] } });

    expect(sessionStorage.getItem('prumo_token')).toBe('jwt');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.temPerfil(['ProductOwner'])).toBe(true);
    expect(service.temPerfil(['TechLead'])).toBe(false);
  });

  it('token expirado não conta como autenticado', () => {
    sessionStorage.setItem('prumo_token', 'jwt');
    sessionStorage.setItem('prumo_expira_em', new Date(Date.now() - 1000).toISOString());
    expect(service.isAuthenticated()).toBe(false);
  });

  it('Administrador tem acesso a qualquer perfil', () => {
    const expiraEm = new Date(Date.now() + 3600_000).toISOString();
    service.loginGoogle('x').subscribe();
    http.expectOne(() => true).flush({ token: 't', expiraEm, usuario: { id: '1', nome: 'A', email: 'a', perfis: ['Administrador'] } });
    expect(service.temPerfil(['Diretoria'])).toBe(true);
  });
});
