import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Login } from './components/login/login';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, Sidebar, Header, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  isLoggedIn = signal(false);
  activeView = signal('dashboard');
  protected readonly title = signal('prumo');

  titles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    projetos: 'Projetos',
    okrs: 'OKRs',
    integracoes: 'Integrações',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações',
  };

  constructor(private router: Router) {
    this.syncStateFromUrl(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.syncStateFromUrl(nav.urlAfterRedirects);
      });
  }

  handleLogin() {
    this.isLoggedIn.set(true);
    this.router.navigate(['/dashboard']);
  }

  handleNavigate(view: string) {
    this.activeView.set(view);
    this.router.navigate([`/${view}`]);
  }

  private syncStateFromUrl(url: string): void {
    const segment = url.replace(/^\//, '').split('/')[0] || 'login';
    this.isLoggedIn.set(segment !== 'login');
    if (segment !== 'login' && this.titles[segment]) {
      this.activeView.set(segment);
    }
  }
}
