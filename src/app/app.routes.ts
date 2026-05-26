import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Portfolios } from './components/portfolios/portfolios';
import { Projetos } from './components/projetos/projetos';
import { CriarProjeto } from './components/projetos/criar-projeto/criar-projeto';
import { Okrs } from './components/okrs/okrs';
import { Configuracoes } from './components/configuracoes/configuracoes';
import { Integracoes } from './components/integracoes/integracoes';
import { Relatorios } from './components/relatorios/relatorios';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'portfolios', component: Portfolios },
  { path: 'projetos/novo', component: CriarProjeto },
  { path: 'projetos', component: Projetos },
  { path: 'okrs', component: Okrs },
  { path: 'configuracoes', component: Configuracoes },
  { path: 'integracoes', component: Integracoes },
  { path: 'relatorios', component: Relatorios },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
