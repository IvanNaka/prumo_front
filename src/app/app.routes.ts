import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { Dashboard } from './components/dashboard/dashboard';
import { Dependencias } from './components/dependencias/dependencias';
import { Integracoes } from './components/integracoes/integracoes';
import { Login } from './components/login/login';
import { NaoAutorizado } from './components/nao-autorizado/nao-autorizado';
import { Okrs } from './components/okrs/okrs';
import { Portfolios } from './components/portfolios/portfolios';
import { CriarProjeto } from './components/projetos/criar-projeto/criar-projeto';
import { DetalhesProjeto } from './components/projetos/detalhes-projeto/detalhes-projeto';
import { Projetos } from './components/projetos/projetos';
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
      { path: 'dashboard', component: Dashboard },
      { path: 'portfolios', component: Portfolios },
      { path: 'projetos/novo', component: CriarProjeto },
      { path: 'projetos/:id', component: DetalhesProjeto },
      { path: 'projetos', component: Projetos },
      { path: 'dependencias', component: Dependencias },
      { path: 'times', component: Times },
      { path: 'okrs', component: Okrs },
      { path: 'integracoes', component: Integracoes },
      { path: 'relatorios', component: Relatorios },
      { path: 'nao-autorizado', component: NaoAutorizado },
      { path: '', redirectTo: 'portfolios', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
