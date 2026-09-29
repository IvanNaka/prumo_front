import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

import { PORTFOLIO_ATIVO_KEY, PortfolioContextService } from '../services/portfolio-context.service';
import { portfolioGuard } from './portfolio.guard';

function rota(id: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
}

describe('portfolioGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('sem portfólio ativo redireciona para /portfolios', () => {
    const result = TestBed.runInInjectionContext(() => portfolioGuard(rota('p1'), {} as never));
    const router = TestBed.inject(Router);
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/portfolios');
  });

  it('depois de um F5 recarrega o portfólio ativo guardado na sessão', async () => {
    sessionStorage.setItem(PORTFOLIO_ATIVO_KEY, 'p1');
    const http = TestBed.inject(HttpTestingController);
    const contexto = TestBed.inject(PortfolioContextService);

    const result = TestBed.runInInjectionContext(() => portfolioGuard(rota('p1'), {} as never));
    expect(isObservable(result)).toBe(true);
    const promise = firstValueFrom(result as Observable<boolean | UrlTree>);
    http.expectOne((r) => r.url.endsWith('/portfolios/p1')).flush({ id: 'p1', nome: 'Portfólio 1', status: 'Criado' });

    expect(await promise).toBe(true);
    expect(contexto.ativo()?.nome).toBe('Portfólio 1');
    expect(sessionStorage.getItem(PORTFOLIO_ATIVO_KEY)).toBe('p1');
  });

  it('RN06 limpa o portfólio ativo', async () => {
    sessionStorage.setItem(PORTFOLIO_ATIVO_KEY, 'p2');
    const http = TestBed.inject(HttpTestingController);

    const result = TestBed.runInInjectionContext(() => portfolioGuard(rota('p2'), {} as never));
    const promise = firstValueFrom(result as Observable<boolean | UrlTree>);
    http
      .expectOne((r) => r.url.endsWith('/portfolios/p2'))
      .flush({ detail: 'Você não tem permissão para acessar este portfólio.' }, { status: 403, statusText: 'Forbidden' });

    expect((await promise) instanceof UrlTree).toBe(true);
    expect(sessionStorage.getItem(PORTFOLIO_ATIVO_KEY)).toBeNull();
  });
});
