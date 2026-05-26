import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';

interface AuthTokenResponse {
	token?: string;
	jwt?: string;
	accessToken?: string;
}

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly http = inject(HttpClient);
	private readonly tokenKey = 'prumo_jwt_token';
	private readonly legacyTokenKey = 'prumo_google_credential';
	private readonly loginUrl = `${environment.apiUrl}/Auth/google`;

	exchangeGoogleToken(idToken: string): Observable<string> {
		return this.http.post<AuthTokenResponse | string>(this.loginUrl, { idToken }).pipe(
			map((response) => this.extractToken(response))
		);
	}

	storeToken(token: string): void {
		localStorage.setItem(this.tokenKey, token);
		localStorage.removeItem(this.legacyTokenKey);
	}

	getToken(): string | null {
		return localStorage.getItem(this.tokenKey);
	}

	hasToken(): boolean {
		return this.getToken() !== null;
	}

	clearToken(): void {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.legacyTokenKey);
	}

	private extractToken(response: AuthTokenResponse | string): string {
		if (typeof response === 'string') {
			return response;
		}

		const token = response.token ?? response.jwt ?? response.accessToken;

		if (!token) {
			throw new Error('Resposta de autenticação inválida.');
		}

		return token;
	}
}