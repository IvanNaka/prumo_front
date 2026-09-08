import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type IntegrationType = 'Jira' | 'AzureDevOps' | 'GitHub' | 'Trello';

export type LastSyncStatus = 'Success' | 'Unavailable' | 'AuthenticationFailed';

export interface Integration {
	id: string;
	type: IntegrationType;
	apiUrl: string;
	isActive: boolean;
	syncIntervalMinutes: number;
	lastSyncedAt?: string | null;
	lastSyncStatus?: LastSyncStatus | null;
}

export interface CreateIntegrationDto {
	type: IntegrationType;
	apiUrl: string;
	token: string;
	syncIntervalMinutes?: number;
}

export interface UpdateIntegrationDto {
	apiUrl: string;
	token?: string | null;
	isActive: boolean;
	syncIntervalMinutes: number;
}

export interface SyncResult {
	[key: string]: unknown;
}

@Injectable({
	providedIn: 'root',
})
export class IntegrationsService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Integrations`;

	getIntegrations(): Observable<Integration[]> {
		return this.http.get<Integration[]>(this.baseUrl);
	}

	createIntegration(integration: CreateIntegrationDto): Observable<Integration> {
		return this.http.post<Integration>(this.baseUrl, integration);
	}

	updateIntegration(id: string, integration: UpdateIntegrationDto): Observable<Integration> {
		return this.http.put<Integration>(`${this.baseUrl}/${id}`, integration);
	}

	deleteIntegration(id: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	syncIntegration(id: string): Observable<SyncResult> {
		return this.http.post<SyncResult>(`${this.baseUrl}/${id}/sync`, null);
	}
}
