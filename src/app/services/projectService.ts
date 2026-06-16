import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Project {
	id?: string;
	portfolioId?: string;
	portfolioName?: string;
	name?: string | null;
	description?: string | null;
	status?: number;
	ownerId?: string;
	ownerName?: string;
	projectEvaluations?: ProjectEvaluationsDTO[];
}
export interface CreateProjectDto {
	name?: string | null;
	description: number;
	portfolioId: string;
	projectEvaluationList: CreateProjectEvaluationDto[];
}

export interface CreateProjectEvaluationDto {
	Value: number;
	PortfolioMetricId: string;
}
export interface ProjectEvaluationsDTO {
	id: string;
	priorityCriteriaName: string;
	value: number;	
}

@Injectable({
	providedIn: 'root',
})
export class ProjectService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Projects`;

	getProjects(): Observable<Project[]> {
		return this.http.get<Project[]>(this.baseUrl);
	}

	getProjectById(id: string): Observable<Project> {
		return this.http.get<Project>(`${this.baseUrl}/${id}`);
	}

	getProjectsByPortfolio(portfolioId: string): Observable<Project[]> {
		return this.http.get<Project[]>(`${this.baseUrl}/portfolio/${portfolioId}`);
	}

	getProjectsByOwner(ownerId: string): Observable<Project[]> {
		return this.http.get<Project[]>(`${this.baseUrl}/owner/${ownerId}`);
	}

	createProject(project: CreateProjectDto): Observable<Project> {
		return this.http.post<Project>(this.baseUrl, project);
	}

	updateProject(id: string, project: Project): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, project);
	}

	deleteProject(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}
