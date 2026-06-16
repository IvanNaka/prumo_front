import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface PriorityCriteria {
	id: string;
	name?: string | null;
	valueWeight: number;
	portfolioId: string;
	userId: string;
}

export interface CreatePriorityCriteriaDto {
	name?: string | null;
	valueWeight: number;
	portfolioId: string;
}

export interface UpdatePriorityCriteriaDto {
	id: string;
	name?: string | null;
	valueWeight: number;
}

@Injectable({
	providedIn: 'root',
})
export class PriorityCriteriaService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/PriorityCriteria`;

	getPriorityCriteria(): Observable<PriorityCriteria[]> {
		return this.http.get<PriorityCriteria[]>(this.baseUrl);
	}

	getPriorityCriteriaById(id: string): Observable<PriorityCriteria> {
		return this.http.get<PriorityCriteria>(`${this.baseUrl}/${id}`);
	}

	getPriorityCriteriaByPortfolio(portfolioId: string): Observable<PriorityCriteria[]> {
		return this.http.get<PriorityCriteria[]>(`${this.baseUrl}/portfolio/${portfolioId}`);
	}

	getPriorityCriteriaByUser(userId: string): Observable<PriorityCriteria[]> {
		return this.http.get<PriorityCriteria[]>(`${this.baseUrl}/user/${userId}`);
	}

	createPriorityCriteria(priorityCriteria: CreatePriorityCriteriaDto): Observable<PriorityCriteria> {
		return this.http.post<PriorityCriteria>(this.baseUrl, priorityCriteria);
	}

	updatePriorityCriteria(id: string, priorityCriteria: UpdatePriorityCriteriaDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, priorityCriteria);
	}

	deletePriorityCriteria(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}