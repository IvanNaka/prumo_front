import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Portfolio {
	id: string;
	name?: string | null;
	description?: string | null;
	ownerId: string;
	ownerName?: string | null;
	createdAt?: string;
}

export interface CreatePortfolioDto {
	name?: string | null;
	description?: string | null;
}

export interface UpdatePortfolioDto {
	id: string;
	name?: string | null;
	description?: string | null;
}

@Injectable({
	providedIn: 'root',
})
export class PortfoliosService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Portfolios`;

	getPortfolios(): Observable<Portfolio[]> {
		return this.http.get<Portfolio[]>(this.baseUrl);
	}

	getPortfolioById(id: string): Observable<Portfolio> {
		return this.http.get<Portfolio>(`${this.baseUrl}/${id}`);
	}

	getPortfoliosByOwner(ownerId: string): Observable<Portfolio[]> {
		return this.http.get<Portfolio[]>(`${this.baseUrl}/owner/${ownerId}`);
	}

	createPortfolio(portfolio: CreatePortfolioDto): Observable<Portfolio> {
		return this.http.post<Portfolio>(this.baseUrl, portfolio);
	}

	updatePortfolio(id: string, portfolio: UpdatePortfolioDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, portfolio);
	}

	deletePortfolio(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}