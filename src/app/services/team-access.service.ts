import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { AuthService } from './auth.service';
import { TeamsService } from './teamsService';

/**
 * Controla se o usuário autenticado já pertence a algum time (dono ou
 * membro). Enquanto não pertencer, a navegação fica restrita à página de
 * Times (ver `teamRequiredGuard`) e o menu lateral só mostra essa opção.
 */
@Injectable({
	providedIn: 'root',
})
export class TeamAccessService {
	private readonly authService = inject(AuthService);
	private readonly teamsService = inject(TeamsService);

	/** `null` enquanto ainda não foi possível determinar (assume liberado). */
	private readonly _hasTeam = signal<boolean | null>(null);
	readonly hasTeam = this._hasTeam.asReadonly();

	/** Busca no backend se o usuário logado já participa de algum time. */
	checkHasTeam(): Observable<boolean> {
		const userId = this.authService.getUserId();

		if (!userId) {
			this._hasTeam.set(true);
			return of(true);
		}

		return this.teamsService.getTeams().pipe(
			map((teams) =>
				teams.some((team) => team.ownerUserId === userId || team.members.some((m) => m.userId === userId))
			),
			tap((belongs) => this._hasTeam.set(belongs)),
			catchError(() => {
				this._hasTeam.set(true);
				return of(true);
			})
		);
	}

	/** Chamado assim que o usuário entra ou cria um time, para liberar a navegação na hora. */
	markHasTeam(): void {
		this._hasTeam.set(true);
	}

	/** Permite que outras telas (ex.: Times) sincronizem o estado já calculado localmente. */
	setHasTeam(value: boolean): void {
		this._hasTeam.set(value);
	}

	/** Deve ser chamado no logout (ou em erro 401) para não reter o estado do usuário anterior. */
	clearCache(): void {
		this._hasTeam.set(null);
	}
}
