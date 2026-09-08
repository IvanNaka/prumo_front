import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CurrentUserService } from '../../services/current-user.service';
import { TeamAccessService } from '../../services/team-access.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: true
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly teamAccessService = inject(TeamAccessService);
  private readonly router = inject(Router);

  title = input<string>('');
  readonly showUserMenu = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update((value) => !value);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  logout(): void {
    this.authService.clearToken();
    this.currentUserService.clearCache();
    this.teamAccessService.clearCache();
    this.closeUserMenu();
    void this.router.navigate(['/login']);
  }
}
