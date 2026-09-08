import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TeamAccessService } from '../services/team-access.service';

/**
 * Bloqueia o acesso a qualquer rota (exceto /times, /login e /nao-autorizado)
 * enquanto o usuário autenticado não pertencer a nenhum time. Nesse caso ele é
 * redirecionado automaticamente para /times.
 */
export const teamRequiredGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const teamAccessService = inject(TeamAccessService);
	const router = inject(Router);

	if (!authService.hasToken()) {
		return true;
	}

	return teamAccessService.checkHasTeam().pipe(
		map((hasTeam) => hasTeam || router.createUrlTree(['/times']))
	);
};
