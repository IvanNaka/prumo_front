import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: true
})
export class Header {
  private readonly authService = inject(AuthService);
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
    this.closeUserMenu();
    void this.router.navigate(['/login']);
  }
}
