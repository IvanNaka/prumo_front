import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CurrentUserService } from './current-user.service';
import { TeamAccessService } from './team-access.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
	const authService = inject(AuthService);
	const currentUserService = inject(CurrentUserService);
	const teamAccessService = inject(TeamAccessService);
	const router = inject(Router);
	const token = authService.getToken();
	const isApiRequest = request.url.startsWith(environment.apiUrl);

	const authRequest = token && isApiRequest
		? request.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`,
			},
		})
		: request;

	return next(authRequest).pipe(
		catchError((error: unknown) => {
			if (error instanceof HttpErrorResponse && error.status === 401) {
				authService.clearToken();
				currentUserService.clearCache();
				teamAccessService.clearCache();
				void router.navigate(['/login']);
			}

			return throwError(() => error);
		})
	);
};