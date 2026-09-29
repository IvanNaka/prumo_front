import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '../models/enums';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const RN27 = 'Seu perfil não tem permissão para esta ação.';

/**
 * Libera a rota se o usuário tiver ao menos um dos perfis (ou for Administrador).
 * Caso contrário mostra a mensagem RN27 e permanece na rota anterior
 * (na primeira navegação, volta para /portfolios).
 */
export function roleGuard(perfis: readonly Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.temPerfil(perfis)) {
      return true;
    }

    inject(ToastService).erro(RN27);
    return router.navigated ? false : router.createUrlTree(['/portfolios']);
  };
}
