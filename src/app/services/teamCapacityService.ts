import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * ⚠️ ENDPOINTS AINDA NÃO EXISTEM NO BACKEND.
 * O front-end assume um novo `TeamCapacitiesController`, pois nenhum
 * endpoint existente (`Teams`, `Projects`, etc.) cobre capacidade mensal por
 * colaborador. Ver `docs/backend-endpoints-capacidade.md` para o contrato
 * completo esperado.
 */
export interface TeamCapacityEntry {
	id: string;
	teamId: string;
	userId: string;
	userName?: string | null;
	year: number;
	month: number;
	/** Horas disponíveis registradas para o colaborador no mês (Cenário 3). */
	availableHours: number;
	/** Horas alocadas/ocupadas no mês, calculadas pelo backend a partir das demandas. */
	allocatedHours: number;
	/** Percentual de ocupação calculado pelo backend (`allocatedHours / availableHours * 100`). */
	occupancyPercent: number;
	updatedAt?: string;
}

export interface CreateTeamCapacityDto {
	teamId: string;
	userId: string;
	year: number;
	month: number;
	availableHours: number;
}

export interface UpdateTeamCapacityDto {
	id: string;
	availableHours: number;
}

@Injectable({
	providedIn: 'root',
})
export class TeamCapacityService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/TeamCapacities`;

	/** Visualização de capacidade (Cenário 1): todos os registros mensais de um time. */
	getCapacityByTeam(teamId: string): Observable<TeamCapacityEntry[]> {
		return this.http.get<TeamCapacityEntry[]>(`${this.baseUrl}/team/${teamId}`);
	}

	/**
	 * Registro de capacidade mensal (Cenário 3). O backend deve fazer
	 * upsert: se já existir um registro para `userId` + `year` + `month`,
	 * atualiza `availableHours`; caso contrário, cria um novo registro.
	 */
	registerCapacity(entry: CreateTeamCapacityDto): Observable<TeamCapacityEntry> {
		return this.http.post<TeamCapacityEntry>(this.baseUrl, entry);
	}

	updateCapacity(id: string, entry: UpdateTeamCapacityDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, entry);
	}

	deleteCapacity(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}
