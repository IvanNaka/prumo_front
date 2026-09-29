import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';

/** Layout das páginas autenticadas: menu lateral, cabeçalho e conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="app-content">
        <app-header [title]="titulo()"></app-header>
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

  constructor() {
    this.atualizarTitulo();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.atualizarTitulo());
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
