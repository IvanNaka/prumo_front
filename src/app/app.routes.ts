import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { portfolioGuard } from './core/guards/portfolio.guard';
import { roleGuard } from './core/guards/role.guard';
import { PERMISSOES } from './core/models/permissoes';
import { Usuarios } from './components/admin/usuarios/usuarios';
import { Dashboard } from './components/dashboard/dashboard';
import { Dependencias } from './components/dependencias/dependencias';
import { Integracoes } from './components/integracoes/integracoes';
import { Login } from './components/login/login';
import { NaoAutorizado } from './components/nao-autorizado/nao-autorizado';
import { Okrs } from './components/okrs/okrs';
import { Criterios } from './components/portfolio/criterios/criterios';
import { VisaoGeral } from './components/portfolio/visao-geral/visao-geral';
import { Portfolios } from './components/portfolios/portfolios';
import { Projetos } from './components/portfolio/projetos/projetos';
import { ProjetoDetalhePage } from './components/projetos/detalhe/projeto-detalhe';
import { Relatorios } from './components/relatorios/relatorios';
import { Times } from './components/times/times';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'portfolios', component: Portfolios, data: { titulo: 'Portfólios' } },
      {
        // Rotas que dependem do portfólio ativo (UC3).
        path: 'portfolios/:id',
        canActivate: [portfolioGuard],
        children: [
          { path: 'visao-geral', component: VisaoGeral, data: { titulo: 'Visão geral do portfólio' } },
          { path: 'criterios', component: Criterios, data: { titulo: 'Critérios de priorização' } },
          { path: 'dashboard', component: Dashboard, data: { titulo: 'Dashboard' } },
          { path: 'projetos', component: Projetos, data: { titulo: 'Projetos' } },
          { path: 'dependencias', component: Dependencias, data: { titulo: 'Dependências' } },
          {
            path: 'relatorios',
            component: Relatorios,
            canActivate: [roleGuard(PERMISSOES.verRelatorios)],
            data: { titulo: 'Relatórios' },
          },
          { path: '', redirectTo: 'visao-geral', pathMatch: 'full' },
        ],
      },
      { path: 'projetos/:id', component: ProjetoDetalhePage, data: { titulo: 'Projeto' } },
      { path: 'equipes', component: Times, data: { titulo: 'Equipes' } },
      { path: 'okrs', component: Okrs, data: { titulo: 'OKRs' } },
      {
        path: 'integracoes/jira',
        component: Integracoes,
        canActivate: [roleGuard(PERMISSOES.integracoes)],
        data: { titulo: 'Integração Jira' },
      },
      {
        path: 'admin/usuarios',
        component: Usuarios,
        canActivate: [roleGuard(PERMISSOES.gerirUsuarios)],
        data: { titulo: 'Usuários' },
      },
      { path: 'nao-autorizado', component: NaoAutorizado, data: { titulo: 'Acesso não autorizado' } },
      { path: '', redirectTo: 'portfolios', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
