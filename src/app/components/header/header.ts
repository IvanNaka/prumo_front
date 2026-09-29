import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { ROTULO_ROLE } from '../../core/models/rotulos';
import { AuthService } from '../../core/services/auth.service';
import { NotificacoesService } from '../../core/services/notificacoes.service';
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
  readonly naoLidas = inject(NotificacoesService).naoLidas;

  constructor() {
    // Contagem de não lidas atualizada a cada 60 segundos.
    const notificacoes = inject(NotificacoesService);
    timer(0, 60_000)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => notificacoes.atualizarContagem());
  }

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
