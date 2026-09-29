import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { mensagemDeErro } from '../models/problem';
import { AuthService } from '../services/auth.service';
import { PortfolioContextService } from '../services/portfolio-context.service';
import { ToastService } from '../services/toast.service';

export const RN06 = 'Você não tem permissão para acessar este portfólio.';

/**
 * Adiciona `Authorization: Bearer <token>`; em 401 limpa a sessão e volta para /login;
 * em 403 com RN06 limpa o portfólio ativo e volta para a lista de portfólios.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const contexto = inject(PortfolioContextService);
  const toast = inject(ToastService);
  const router = inject(Router);
  const token = authService.getToken();
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const isLogin = request.url.endsWith('/auth/google');

  const authRequest =
    token && isApiRequest && !isLogin
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLogin) {
        authService.logout();
        contexto.limpar();
        void router.navigate(['/login']);
      } else if (error instanceof HttpErrorResponse && error.status === 403 && mensagemDeErro(error) === RN06) {
        contexto.limpar();
        toast.erro(RN06);
        void router.navigate(['/portfolios']);
      }
      return throwError(() => error);
    })
  );
};
