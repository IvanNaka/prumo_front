import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { mensagemDeErro } from '../../core/models/problem';
import { AuthService } from '../../core/services/auth.service';

declare const google: any;

/**
 * UC1 — Autenticar usuário: somente login com Google (D01). O ID token recebido do Google é
 * enviado para POST /api/auth/google, que devolve o JWT do Prumo.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private intervalo?: number;

  readonly googleClientConfigured = Boolean(environment.googleClientId);
  readonly erro = signal<string | null>(null);
  readonly entrando = signal(false);

  @ViewChild('googleButton', { static: true })
  private btnRef!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (!this.googleClientConfigured) {
      return;
    }
    if (this.googleDisponivel()) {
      this.renderizarBotao();
      return;
    }
    // O script do Google (index.html) é carregado de forma assíncrona.
    this.intervalo = window.setInterval(() => {
      if (this.googleDisponivel()) {
        window.clearInterval(this.intervalo);
        this.renderizarBotao();
      }
    }, 100);
    window.setTimeout(() => window.clearInterval(this.intervalo), 10000);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.intervalo);
  }

  onGoogle(idToken: string): void {
    this.erro.set(null);
    this.entrando.set(true);
    this.authService.loginGoogle(idToken).subscribe({
      next: () => {
        this.entrando.set(false);
        void this.router.navigate(['/portfolios']);
      },
      error: (error) => {
        this.entrando.set(false);
        // RN01, RN02 ou RN03: a mensagem vem no campo "detail".
        this.erro.set(mensagemDeErro(error, 'Não foi possível realizar o login. Tente novamente.'));
      },
    });
  }

  private googleDisponivel(): boolean {
    return typeof google !== 'undefined' && !!google?.accounts?.id;
  }

  private renderizarBotao(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (r: any) => this.zone.run(() => this.onGoogle(r.credential)),
    });
    google.accounts.id.renderButton(this.btnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      locale: 'pt-BR',
      shape: 'pill',
    });
  }
}
