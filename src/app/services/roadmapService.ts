import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * ⚠️ ENDPOINTS AINDA NÃO EXISTEM NO BACKEND.
 * O front-end assume um novo `RoadmapsController` (contrato análogo aos
 * demais controllers, ex.: `Portfolios`, `Teams`), pois nenhum endpoint
 * existente cobre itens de roadmap (marcos/fases com período planejado por
 * portfólio). Ver `docs/backend-endpoints-roadmap.md` para o contrato
 * completo esperado.
 */
export enum RoadmapItemStatus {
	Planejado = 0,
	EmAndamento = 1,
	Concluido = 2,
	Atrasado = 3,
}

export interface RoadmapItem {
	id: string;
	portfolioId: string;
	projectId?: string | null;
	projectName?: string | null;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	status: RoadmapItemStatus;
	order: number;
	createdAt?: string;
}

export interface CreateRoadmapItemDto {
	portfolioId: string;
	projectId?: string | null;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	status: RoadmapItemStatus;
}

export interface UpdateRoadmapItemDto {
	id: string;
	projectId?: string | null;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	status: RoadmapItemStatus;
	order: number;
}

@Injectable({
	providedIn: 'root',
})
export class RoadmapService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Roadmaps`;

	getRoadmapByPortfolio(portfolioId: string): Observable<RoadmapItem[]> {
		return this.http.get<RoadmapItem[]>(`${this.baseUrl}/portfolio/${portfolioId}`);
	}

	createRoadmapItem(item: CreateRoadmapItemDto): Observable<RoadmapItem> {
		return this.http.post<RoadmapItem>(this.baseUrl, item);
	}

	updateRoadmapItem(id: string, item: UpdateRoadmapItemDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, item);
	}

	deleteRoadmapItem(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Reordena os itens estruturais do roadmap dentro de um portfólio.
	 * Contrato assumido: `PUT /api/Roadmaps/portfolio/{portfolioId}/reorder`
	 * com o array de ids na nova ordem.
	 */
	reorderRoadmapItems(portfolioId: string, orderedIds: string[]): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/portfolio/${portfolioId}/reorder`, { orderedIds });
	}
}
