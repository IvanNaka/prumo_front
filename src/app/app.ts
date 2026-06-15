import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Login } from './components/login/login';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, Sidebar, Header, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  isLoggedIn = signal(false);
  authError = signal<string | null>(null);
  activeView = signal('dashboard');
  protected readonly title = signal('prumo');

  titles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    portfolios: 'Portfolios',
    projetos: 'Projetos',
    dependencias: 'Dependências',
    okrs: 'OKRs',
    integracoes: 'Integrações',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações',
  };

  constructor() {
    if (this.authService.hasToken()) {
      this.isLoggedIn.set(true);
    }

    this.syncStateFromUrl(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.syncStateFromUrl(nav.urlAfterRedirects);
      });
  }

  handleLogin(credential: string) {
    this.authError.set(null);

    this.authService.exchangeGoogleToken(credential).subscribe({
      next: (jwt) => {
        this.authService.storeToken(jwt);
        this.isLoggedIn.set(true);
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.authError.set('Não foi possível autenticar com Google agora.');
        this.isLoggedIn.set(false);
      },
    });
  }

  handleNavigate(view: string) {
    this.activeView.set(view);
    this.router.navigate([`/${view}`]);
  }

  private syncStateFromUrl(url: string): void {
    const segment = url.replace(/^\//, '').split('/')[0] || 'login';
    if (segment === 'login') {
      if (this.authService.hasToken()) {
        this.isLoggedIn.set(true);
        void this.router.navigate(['/dashboard']);
        return;
      }

      this.isLoggedIn.set(false);
      return;
    }

    this.isLoggedIn.set(true);
    if (segment !== 'login' && this.titles[segment]) {
      this.activeView.set(segment);
    }
  }
}
