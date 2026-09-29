import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, tap } from 'rxjs';

import { Portfolio } from '../models/portfolio';
import { PortfoliosService } from './portfolios.service';

export const PORTFOLIO_ATIVO_KEY = 'portfolioAtivoId';

/**
 * Portfólio ativo (RF06 / UC3). A pós-condição do UC3 é "Portfólio ativo na sessão": o id fica no
 * sessionStorage e sobrevive a um F5.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioContextService {
  private readonly portfoliosService = inject(PortfoliosService);

  private readonly atual = signal<Portfolio | null>(null);

  readonly ativo = this.atual.asReadonly();
  /** Observable do portfólio ativo (BehaviorSubject-like). */
  readonly ativo$ = toObservable(this.atual);
  readonly ativoId = computed(() => this.atual()?.id ?? this.idSalvo());
  readonly encerrado = computed(() => this.atual()?.status === 'Encerrado');

  /** Id guardado na sessão (mesmo antes de o portfólio ser carregado). */
  idSalvo(): string | null {
    return sessionStorage.getItem(PORTFOLIO_ATIVO_KEY);
  }

  definir(portfolio: Portfolio): void {
    sessionStorage.setItem(PORTFOLIO_ATIVO_KEY, portfolio.id);
    this.atual.set(portfolio);
  }

  /** Busca GET /portfolios/{id} e torna o portfólio ativo. */
  selecionar(id: string): Observable<Portfolio> {
    const atual = this.atual();
    if (atual?.id === id) {
      return of(atual);
    }
    return this.portfoliosService.obter(id).pipe(tap((p) => this.definir(p)));
  }

  /** Recarrega o portfólio ativo (ex.: depois de uma ação que muda o status). */
  recarregar(): void {
    const id = this.ativoId();
    if (id) {
      this.portfoliosService.obter(id).subscribe({ next: (p) => this.definir(p) });
    }
  }

  limpar(): void {
    sessionStorage.removeItem(PORTFOLIO_ATIVO_KEY);
    this.atual.set(null);
  }
}
