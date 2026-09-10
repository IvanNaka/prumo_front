import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TeamAccessService } from '../../services/team-access.service';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: true
})
export class Sidebar {
  private readonly teamAccessService = inject(TeamAccessService);

  activeItem = input<string>('dashboard');
  onNavigate = output<string>();

  private readonly allMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'portfolios', icon: 'portfolio', label: 'Portfólios' },
    { id: 'projetos', icon: 'folder-open', label: 'Projetos' },
    { id: 'dependencias', icon: 'link', label: 'Dependências' },
    { id: 'times', icon: 'team', label: 'Times' },
    { id: 'integracoes', icon: 'integration', label: 'Integrações' },
    // { id: 'okrs', icon: 'target', label: 'OKRs' },
    // { id: 'relatorios', icon: 'bar-chart-3', label: 'Relatórios' },
    // { id: 'configuracoes', icon: 'settings', label: 'Configurações' },
  ];

  /**
   * Enquanto o usuário não pertencer a nenhum time, o menu só mostra a opção
   * "Times" — o resto das páginas fica bloqueado pelo `teamRequiredGuard`.
   */
  readonly menuItems = computed(() => {
    if (this.teamAccessService.hasTeam() === false) {
      return this.allMenuItems.filter((item) => item.id === 'times');
    }

    return this.allMenuItems;
  });

  handleNavigate(id: string) {
    this.onNavigate.emit(id);
  }

}
