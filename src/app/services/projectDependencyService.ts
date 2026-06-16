import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ProjectDependency {
	id: string;
	reason?: string | null;
	projectId: string;
	projectName?: string | null;
	dependsOnProjectId: string;
	dependsOnProjectName?: string | null;
	userId: string;
	userName?: string | null;
	portfolioId: string;
	portfolioName?: string | null;
}

export interface CreateProjectDependencyDto {
	reason?: string | null;
	projectId: string;
	dependsOnProjectId: string;
    portfolioId: string;
	userId: string;
}

@Injectable({
	providedIn: 'root',
})
export class ProjectDependencyService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/ProjectDependency`;

	getProjectDependencyById(id: string): Observable<ProjectDependency> {
		return this.http.get<ProjectDependency>(`${this.baseUrl}/${id}`);
	}

	getProjectDependenciesByPortfolio(portfolioId: string): Observable<ProjectDependency[]> {
		return this.http.get<ProjectDependency[]>(`${this.baseUrl}/portfolio/${portfolioId}`);
	}

	createProjectDependency(dependency: CreateProjectDependencyDto): Observable<ProjectDependency> {
		return this.http.post<ProjectDependency>(this.baseUrl, dependency);
	}

	deleteProjectDependency(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}