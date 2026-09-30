import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Usuário sem perfil (ainda sem equipe) só acessa /boas-vindas. */
export const comEquipeGuard: CanActivateFn = () =>
  inject(AuthService).semEquipe() ? inject(Router).createUrlTree(['/boas-vindas']) : true;

/** /boas-vindas: exige login e só faz sentido para quem ainda não tem perfil. */
export const semEquipeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    authService.logout();
    return router.createUrlTree(['/login']);
  }
  return authService.semEquipe() ? true : router.createUrlTree(['/']);
};
