import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PERMISSOES } from '../../core/models/permissoes';
import { Portfolio } from '../../core/models/portfolio';
import { mensagemDeErro } from '../../core/models/problem';
import { ROTULO_PORTFOLIO_STATUS } from '../../core/models/rotulos';
import { PortfolioContextService } from '../../core/services/portfolio-context.service';
import { PortfoliosService } from '../../core/services/portfolios.service';
import { ToastService } from '../../core/services/toast.service';
import { badgePortfolio } from '../../shared/cores';
import { TemPerfilDirective } from '../../shared/tem-perfil.directive';
import { PortfolioForm } from './portfolio-form';

/** RF04, RF05, RF06, UC2 e UC3 — lista de portfólios, cadastro e seleção do portfólio ativo. */
@Component({
  selector: 'app-portfolios',
  imports: [TemPerfilDirective, PortfolioForm],
  templateUrl: './portfolios.html',
  styleUrl: './portfolios.css',
})
export class Portfolios {
  private readonly service = inject(PortfoliosService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PORTFOLIO_STATUS;
  readonly badge = badgePortfolio;

  readonly portfolios = signal<Portfolio[]>([]);
  readonly carregando = signal(true);
  readonly formAberto = signal(false);
  readonly ativoId = this.contexto.ativoId;

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

  /** UC3: GET /portfolios/{id}, atualiza o portfólio ativo e abre a visão geral. */
  abrir(portfolio: Portfolio): void {
    this.contexto.selecionar(portfolio.id).subscribe({
      next: () => void this.router.navigate(['/portfolios', portfolio.id, 'visao-geral']),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  criado(portfolio: Portfolio): void {
    this.formAberto.set(false);
    this.portfolios.update((lista) => [portfolio, ...lista]);
  }
}
