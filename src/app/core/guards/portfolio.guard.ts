import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { mensagemDeErro } from '../models/problem';
import { PortfolioContextService } from '../services/portfolio-context.service';
import { ToastService } from '../services/toast.service';

/**
 * Rotas que dependem de portfólio (critérios, projetos, priorização, dashboard etc.).
 * Sem portfólio ativo na sessão -> volta para /portfolios. Com o id na rota, garante que ele seja
 * o portfólio ativo (carregando-o depois de um F5 ou de um link direto).
 */
export const portfolioGuard: CanActivateFn = (route) => {
  const contexto = inject(PortfolioContextService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const id = route.paramMap.get('id');

  if (!contexto.idSalvo() || !id) {
    return router.createUrlTree(['/portfolios']);
  }

  return contexto.selecionar(id).pipe(
    map(() => true),
    catchError((error) => {
      // RN06 (não é membro) ou portfólio inexistente: limpa o portfólio ativo.
      contexto.limpar();
      toast.erro(mensagemDeErro(error));
      return of(router.createUrlTree(['/portfolios']));
    })
  );
};
