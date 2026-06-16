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

	getUserId(): string | null {
		const token = this.getToken();

		if (!token) {
			return null;
		}

		const payload = this.decodeTokenPayload(token);

		if (!payload) {
			return null;
		}

		return this.readClaim(payload, [
			'userId',
			'sub',
			'nameid',
			'uid',
			'oid',
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
		]);
	}

	hasToken(): boolean {
		return this.getToken() !== null;
	}

	clearToken(): void {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.legacyTokenKey);
	}

	private decodeTokenPayload(token: string): Record<string, unknown> | null {
		const segments = token.split('.');

		if (segments.length < 2) {
			return null;
		}

		try {
			const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
			const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
			const decodedPayload = globalThis.atob(paddedPayload);
			const parsedPayload = JSON.parse(decodedPayload) as unknown;

			if (typeof parsedPayload !== 'object' || parsedPayload === null) {
				return null;
			}

			return parsedPayload as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	private readClaim(payload: Record<string, unknown>, claimNames: string[]): string | null {
		for (const claimName of claimNames) {
			const value = payload[claimName];

			if (typeof value === 'string' && value.trim().length > 0) {
				return value;
			}
		}

		return null;
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