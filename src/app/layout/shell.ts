import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';

/** Layout das páginas autenticadas: menu lateral, cabeçalho e conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <div class="app-shell">
      <app-sidebar [activeItem]="activeView()" (onNavigate)="handleNavigate($event)"></app-sidebar>
      <div class="app-content">
        <app-header [title]="titles[activeView()] ?? ''"></app-header>
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

  readonly activeView = signal('portfolios');

  readonly titles: Record<string, string> = {
    dashboard: 'Dashboard',
    portfolios: 'Portfólios',
    projetos: 'Projetos',
    dependencias: 'Dependências',
    times: 'Times',
    okrs: 'OKRs',
    integracoes: 'Integrações',
    relatorios: 'Relatórios',
    'nao-autorizado': 'Acesso não autorizado',
  };

  constructor() {
    this.sync(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.sync((event as NavigationEnd).urlAfterRedirects));
  }

  handleNavigate(view: string): void {
    this.activeView.set(view);
    void this.router.navigate([`/${view}`]);
  }

  private sync(url: string): void {
    const segment = url.replace(/^\//, '').split(/[/?#]/)[0];
    if (this.titles[segment]) {
      this.activeView.set(segment);
    }
  }
}
