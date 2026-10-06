import { Component, computed, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Role } from '../../core/models/enums';
import { PERMISSOES, TODOS } from '../../core/models/permissoes';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioContextService } from '../../core/services/portfolio-context.service';

interface MenuItem {
  rota: string | string[];
  icon: string;
  label: string;
  /** Perfis que podem VER o recurso (Seção 3.6). */
  perfis: readonly Role[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly contexto = inject(PortfolioContextService);

  readonly portfolioAtivo = this.contexto.ativo;

  /** Em telas pequenas o menu vira uma gaveta controlada pelo layout. */
  readonly aberto = input(false);
  readonly fechar = output<void>();

  private readonly itensGerais: MenuItem[] = [
    { rota: '/portfolios', icon: 'portfolio', label: 'Portfólios', perfis: TODOS },
    { rota: '/okrs', icon: 'target', label: 'OKRs', perfis: TODOS },
    { rota: '/equipes', icon: 'team', label: 'Equipes', perfis: TODOS },
    { rota: '/notificacoes', icon: 'bell', label: 'Notificações', perfis: TODOS },
    { rota: '/integracoes/jira', icon: 'integration', label: 'Integração Jira', perfis: PERMISSOES.integracoes },
    { rota: '/admin/usuarios', icon: 'settings', label: 'Usuários', perfis: PERMISSOES.gerirUsuarios },
  ];

  /** Itens que dependem do portfólio ativo (UC3). */
  readonly itensPortfolio = computed<MenuItem[]>(() => {
    this.authService.perfis();
    const id = this.contexto.ativoId();
    if (!id) {
      return [];
    }
    const base = ['/portfolios', id];
    const itens: MenuItem[] = [
      { rota: [...base, 'visao-geral'], icon: 'portfolio', label: 'Visão geral', perfis: TODOS },
      { rota: [...base, 'dashboard'], icon: 'home', label: 'Dashboard', perfis: TODOS },
      { rota: [...base, 'criterios'], icon: 'bar-chart-3', label: 'Critérios', perfis: TODOS },
      { rota: [...base, 'projetos'], icon: 'folder-open', label: 'Projetos', perfis: TODOS },
      { rota: [...base, 'priorizacao'], icon: 'target', label: 'Priorização', perfis: TODOS },
      { rota: [...base, 'dependencias'], icon: 'link', label: 'Dependências', perfis: TODOS },
      { rota: [...base, 'relatorios'], icon: 'bar-chart-3', label: 'Relatórios', perfis: PERMISSOES.verRelatorios },
    ];
    return itens.filter((item) => this.authService.temPerfil(item.perfis));
  });

  /** Cada item aparece somente para os perfis que podem ver aquele recurso. */
  readonly menuItems = computed(() => {
    this.authService.perfis();
    return this.itensGerais.filter((item) => this.authService.temPerfil(item.perfis));
  });
}
