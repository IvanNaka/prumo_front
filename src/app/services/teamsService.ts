import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface TeamMember {
	userId: string;
	userName?: string | null;
	userEmail?: string | null;
	addedDate?: string;
}

export interface Team {
	id: string;
	portfolioId: string;
	portfolioName?: string | null;
	name?: string | null;
	ownerUserId?: string | null;
	ownerUserName?: string | null;
	createdDate?: string;
	members: TeamMember[];
	/**
	 * Código de convite do time. Depende de suporte no backend — ver nota em
	 * `joinTeamByCode`. Enquanto o endpoint não existir, este campo ficará
	 * sempre `undefined`.
	 */
	inviteCode?: string | null;
}

export interface CreateTeamDto {
	portfolioId: string;
	name?: string | null;
	ownerUserId?: string | null;
}

export interface UpdateTeamDto {
	id: string;
	name?: string | null;
	ownerUserId?: string | null;
}

export interface AddTeamMemberDto {
	userId: string;
}

@Injectable({
	providedIn: 'root',
})
export class TeamsService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Teams`;

	getTeams(): Observable<Team[]> {
		return this.http.get<Team[]>(this.baseUrl);
	}

	getTeamById(id: string): Observable<Team> {
		return this.http.get<Team>(`${this.baseUrl}/${id}`);
	}

	getTeamsByPortfolio(portfolioId: string): Observable<Team[]> {
		return this.http.get<Team[]>(`${this.baseUrl}/portfolio/${portfolioId}`);
	}

	createTeam(team: CreateTeamDto): Observable<Team> {
		return this.http.post<Team>(this.baseUrl, team);
	}

	updateTeam(id: string, team: UpdateTeamDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, team);
	}

	deleteTeam(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	addMember(teamId: string, member: AddTeamMemberDto): Observable<Team> {
		return this.http.post<Team>(`${this.baseUrl}/${teamId}/members`, member);
	}

	removeMember(teamId: string, userId: string): Observable<Team> {
		return this.http.delete<Team>(`${this.baseUrl}/${teamId}/members/${userId}`);
	}

	/**
	 * ⚠️ ENDPOINT AINDA NÃO EXISTE NO BACKEND.
	 * Entrar em um time informando o código de convite (o usuário autenticado
	 * via JWT é adicionado como membro automaticamente, sem precisar do id do
	 * time nem de um admin adicioná-lo manualmente).
	 * Contrato assumido: `POST /api/teams/join` com `{ "code": "string" }`,
	 * retornando o `TeamDto` do time em caso de sucesso, `404` se o código não
	 * existir, `409` se o usuário já for membro.
	 */
	joinTeamByCode(code: string): Observable<Team> {
		return this.http.post<Team>(`${this.baseUrl}/join`, { code });
	}

	/**
	 * ⚠️ ENDPOINT AINDA NÃO EXISTE NO BACKEND.
	 * Necessário para o dono/admin do time visualizar/copiar o código de
	 * convite atual. Contrato assumido: `GET /api/teams/{id}/code` retornando
	 * `{ "code": "string" }`.
	 */
	getInviteCode(teamId: string): Observable<{ code: string }> {
		return this.http.get<{ code: string }>(`${this.baseUrl}/${teamId}/code`);
	}
}
