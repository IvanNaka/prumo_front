import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ROTULO_ROLE } from '../../core/models/rotulos';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioContextService } from '../../core/services/portfolio-context.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly router = inject(Router);

  readonly title = input<string>('');
  readonly showUserMenu = signal(false);
  readonly usuario = this.authService.usuario;
  readonly portfolioAtivo = this.contexto.ativo;
  readonly rotuloRole = ROTULO_ROLE;

  toggleUserMenu(): void {
    this.showUserMenu.update((value) => !value);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.contexto.limpar();
    this.closeUserMenu();
    void this.router.navigate(['/login']);
  }
}
