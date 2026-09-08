import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface User {
	id: string;
	name?: string | null;
	email?: string | null;
	roleId: string;
	roleName?: string | null;
	createdDate?: string;
}

@Injectable({
	providedIn: 'root',
})
export class UsersService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Users`;

	getUsers(): Observable<User[]> {
		return this.http.get<User[]>(this.baseUrl);
	}

	getUserById(id: string): Observable<User> {
		return this.http.get<User>(`${this.baseUrl}/${id}`);
	}
}
