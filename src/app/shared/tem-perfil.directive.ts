import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';

import { Role } from '../core/models/enums';
import { AuthService } from '../core/services/auth.service';

/**
 * Exibe o elemento somente se o usuário tiver ao menos um dos perfis (o Administrador vê tudo).
 * Uso: `<button *temPerfil="['ProductOwner']">Editar</button>`.
 * Use `*temPerfil="['GerenteProjeto']; senao: true"` para exibir quando NÃO tiver o perfil.
 */
@Directive({ selector: '[temPerfil]' })
export class TemPerfilDirective {
  private readonly authService = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private visivel = false;

  readonly temPerfil = input<readonly Role[]>([]);
  readonly temPerfilSenao = input(false);

  constructor() {
    effect(() => {
      const permitido = this.authService.temPerfil(this.temPerfil());
      const mostrar = this.temPerfilSenao() ? !permitido : permitido;
      if (mostrar && !this.visivel) {
        this.container.createEmbeddedView(this.template);
        this.visivel = true;
      } else if (!mostrar && this.visivel) {
        this.container.clear();
        this.visivel = false;
      }
    });
  }
}
