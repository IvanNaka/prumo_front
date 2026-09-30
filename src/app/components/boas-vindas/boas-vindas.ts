import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { LoginResponse } from '../../core/models/auth';
import { mensagemDeErro } from '../../core/models/problem';
import { AuthService } from '../../core/services/auth.service';

/**
 * Primeiro acesso: o usuário ainda não tem perfil e só pode entrar em uma equipe (código de
 * convite -> Desenvolvedor) ou criar uma (-> Administrador).
 */
@Component({
  selector: 'app-boas-vindas',
  imports: [ReactiveFormsModule],
  templateUrl: './boas-vindas.html',
  styleUrl: './boas-vindas.css',
})
export class BoasVindas {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly usuario = this.authService.usuario;
  readonly enviando = signal(false);
  readonly erroEntrar = signal<string | null>(null);
  readonly erroCriar = signal<string | null>(null);

  readonly formEntrar = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(8)]],
  });

  readonly formCriar = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
  });

  entrar(): void {
    if (this.formEntrar.invalid) {
      this.formEntrar.markAllAsTouched();
      return;
    }
    this.enviar(this.authService.entrarNaEquipe(this.formEntrar.getRawValue().codigo.trim()), this.erroEntrar, '/portfolios');
  }

  criar(): void {
    if (this.formCriar.invalid) {
      this.formCriar.markAllAsTouched();
      return;
    }
    this.enviar(this.authService.criarEquipe(this.formCriar.getRawValue().nome.trim()), this.erroCriar, '/equipes');
  }

  sair(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private enviar(req: Observable<LoginResponse>, erro: typeof this.erroEntrar, destino: string): void {
    this.erroEntrar.set(null);
    this.erroCriar.set(null);
    this.enviando.set(true);
    req.subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigate([destino]);
      },
      error: (e) => {
        this.enviando.set(false);
        erro.set(mensagemDeErro(e));
      },
    });
  }
}
