import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Role } from '../../core/models/enums';
import { PERMISSOES, TODOS } from '../../core/models/permissoes';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  rota: string;
  icon: string;
  label: string;
  /** Perfis que podem VER o recurso (Seção 3.6). */
  perfis: readonly Role[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  private readonly itens: MenuItem[] = [
    { rota: '/portfolios', icon: 'portfolio', label: 'Portfólios', perfis: TODOS },
    { rota: '/dashboard', icon: 'home', label: 'Dashboard', perfis: TODOS },
    { rota: '/projetos', icon: 'folder-open', label: 'Projetos', perfis: TODOS },
    { rota: '/dependencias', icon: 'link', label: 'Dependências', perfis: TODOS },
    { rota: '/okrs', icon: 'target', label: 'OKRs', perfis: TODOS },
    { rota: '/times', icon: 'team', label: 'Equipes', perfis: TODOS },
    { rota: '/relatorios', icon: 'bar-chart-3', label: 'Relatórios', perfis: PERMISSOES.verRelatorios },
    { rota: '/integracoes', icon: 'integration', label: 'Integrações', perfis: PERMISSOES.integracoes },
  ];

  /** Cada item aparece somente para os perfis que podem ver aquele recurso. */
  readonly menuItems = computed(() => {
    this.authService.perfis();
    return this.itens.filter((item) => this.authService.temPerfil(item.perfis));
  });
}
