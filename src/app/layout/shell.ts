import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Header } from '../components/header/header';
import { PortfolioContextService } from '../core/services/portfolio-context.service';
import { Sidebar } from '../components/sidebar/sidebar';

/** Layout das páginas autenticadas: menu lateral, cabeçalho e conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <div class="app-shell">
      <app-sidebar [aberto]="menuAberto()" (fechar)="menuAberto.set(false)"></app-sidebar>
      @if (menuAberto()) {
        <div class="sidebar-backdrop" (click)="menuAberto.set(false)" aria-hidden="true"></div>
      }
      <div class="app-content">
        <app-header [title]="titulo()" [menuAberto]="menuAberto()" (alternarMenu)="menuAberto.update((v) => !v)"></app-header>
        <main class="app-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrl: '../app.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Título vindo de `data: { titulo }` da rota ativa mais interna. */
  readonly titulo = signal('');

  /** Menu lateral aberto como gaveta em telas pequenas. */
  readonly menuAberto = signal(false);

  constructor() {
    // Depois de um F5, restaura o portfólio ativo guardado na sessão (UC3).
    const contexto = inject(PortfolioContextService);
    const idSalvo = contexto.idSalvo();
    if (idSalvo && !contexto.ativo()) {
      contexto.selecionar(idSalvo).subscribe({ error: () => contexto.limpar() });
    }

    this.atualizarTitulo();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.atualizarTitulo();
        this.menuAberto.set(false);
      });
  }

  private atualizarTitulo(): void {
    let atual = this.route.snapshot;
    let titulo = '';
    while (atual) {
      titulo = (atual.data?.['titulo'] as string | undefined) ?? titulo;
      atual = atual.firstChild!;
    }
    this.titulo.set(titulo);
  }
}
