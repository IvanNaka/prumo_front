import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { CurrentUserService, Role } from '../services/current-user.service';

/**
 * Bloqueia o acesso à rota caso o usuário autenticado não possua uma das roles
 * informadas em `data: { roles: [...] }`. Usuários sem token vão para /login;
 * usuários autenticados sem a role necessária vão para /nao-autorizado.
 */
export const roleGuard: CanActivateFn = (route) => {
	const authService = inject(AuthService);
	const currentUserService = inject(CurrentUserService);
	const router = inject(Router);

	if (!authService.hasToken()) {
		return router.createUrlTree(['/login']);
	}

	const requiredRoles = (route.data?.['roles'] as Role[] | undefined) ?? [];

	if (requiredRoles.length === 0) {
		return true;
	}

	return currentUserService.hasAnyRole(requiredRoles).pipe(
		map((allowed) => allowed || router.createUrlTree(['/nao-autorizado']))
	);
};
