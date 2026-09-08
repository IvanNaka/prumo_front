import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Portfolios } from './components/portfolios/portfolios';
import { Projetos } from './components/projetos/projetos';
import { CriarProjeto } from './components/projetos/criar-projeto/criar-projeto';
import { DetalhesProjeto } from './components/projetos/detalhes-projeto/detalhes-projeto';
import { Dependencias } from './components/dependencias/dependencias';
import { Okrs } from './components/okrs/okrs';
import { Configuracoes } from './components/configuracoes/configuracoes';
import { Integracoes } from './components/integracoes/integracoes';
import { Relatorios } from './components/relatorios/relatorios';
import { Times } from './components/times/times';
import { NaoAutorizado } from './components/nao-autorizado/nao-autorizado';
import { teamRequiredGuard } from './guards/team-required.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [teamRequiredGuard] },
  { path: 'portfolios', component: Portfolios, canActivate: [teamRequiredGuard] },
  { path: 'projetos/novo', component: CriarProjeto, canActivate: [teamRequiredGuard] },
  { path: 'projetos/:id', component: DetalhesProjeto, canActivate: [teamRequiredGuard] },
  { path: 'projetos', component: Projetos, canActivate: [teamRequiredGuard] },
  { path: 'dependencias', component: Dependencias, canActivate: [teamRequiredGuard] },
  { path: 'times', component: Times },
  { path: 'okrs', component: Okrs, canActivate: [teamRequiredGuard] },
  { path: 'configuracoes', component: Configuracoes, canActivate: [teamRequiredGuard] },
  { path: 'integracoes', component: Integracoes, canActivate: [teamRequiredGuard] },
  { path: 'relatorios', component: Relatorios, canActivate: [teamRequiredGuard] },
  { path: 'nao-autorizado', component: NaoAutorizado },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
