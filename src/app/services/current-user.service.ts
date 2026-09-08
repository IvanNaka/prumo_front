import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

import { AuthService } from './auth.service';
import { UsersService } from './usersService';

export type Role =
	| 'PO'
	| 'Gerente'
	| 'Diretoria'
	| 'TechLead'
	| 'ScrumMaster'
	| 'QA'
	| 'DEV'
	| 'Admin';

@Injectable({
	providedIn: 'root',
})
export class CurrentUserService {
	private readonly authService = inject(AuthService);
	private readonly usersService = inject(UsersService);

	private roleCache$: Observable<string | null> | null = null;

	/** Retorna o nome da role do usuário autenticado (ou null se não for possível determinar). */
	getCurrentUserRole(): Observable<string | null> {
		const userId = this.authService.getUserId();

		if (!userId) {
			return of(null);
		}

		if (!this.roleCache$) {
			this.roleCache$ = this.usersService.getUserById(userId).pipe(
				map((user) => user.roleName ?? null),
				catchError(() => of(null)),
				shareReplay(1)
			);
		}

		return this.roleCache$;
	}

	hasAnyRole(roles: Role[]): Observable<boolean> {
		if (roles.length === 0) {
			return of(true);
		}

		return this.getCurrentUserRole().pipe(
			map((role) => !!role && roles.some((allowed) => allowed.toLowerCase() === role.toLowerCase()))
		);
	}

	/** Deve ser chamado no logout (ou em erro 401) para não reter a role de um usuário anterior. */
	clearCache(): void {
		this.roleCache$ = null;
	}
}
