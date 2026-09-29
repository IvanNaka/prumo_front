import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PERMISSOES } from '../../core/models/permissoes';
import { Portfolio } from '../../core/models/portfolio';
import { mensagemDeErro } from '../../core/models/problem';
import { ROTULO_PORTFOLIO_STATUS } from '../../core/models/rotulos';
import { PortfoliosService } from '../../core/services/portfolios.service';
import { ToastService } from '../../core/services/toast.service';
import { badgePortfolio } from '../../shared/cores';
import { TemPerfilDirective } from '../../shared/tem-perfil.directive';
import { PortfolioForm } from './portfolio-form';

/** RF04, RF05, UC2 e UC3 — lista de portfólios e cadastro de um novo. */
@Component({
  selector: 'app-portfolios',
  imports: [TemPerfilDirective, PortfolioForm],
  templateUrl: './portfolios.html',
  styleUrl: './portfolios.css',
})
export class Portfolios {
  private readonly service = inject(PortfoliosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PORTFOLIO_STATUS;
  readonly badge = badgePortfolio;

  readonly portfolios = signal<Portfolio[]>([]);
  readonly carregando = signal(true);
  readonly formAberto = signal(false);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.portfolios.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e, 'Não foi possível carregar os portfólios.'));
      },
    });
  }

  abrir(portfolio: Portfolio): void {
    void this.router.navigate(['/portfolios', portfolio.id, 'visao-geral']);
  }

  criado(portfolio: Portfolio): void {
    this.formAberto.set(false);
    this.portfolios.update((lista) => [portfolio, ...lista]);
  }
}
