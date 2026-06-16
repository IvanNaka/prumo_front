import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  activeItem = input<string>('dashboard');
  onNavigate = output<string>();

  menuItems: MenuItem[] = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'portfolios', icon: 'portfolio', label: 'Portfólios' },
    { id: 'projetos', icon: 'folder-open', label: 'Projetos' },
    { id: 'dependencias', icon: 'link', label: 'Dependências' },
    // { id: 'okrs', icon: 'target', label: 'OKRs' },
    // { id: 'integracoes', icon: 'link', label: 'Integrações' },
    // { id: 'relatorios', icon: 'bar-chart-3', label: 'Relatórios' },
    // { id: 'configuracoes', icon: 'settings', label: 'Configurações' },
  ];

  handleNavigate(id: string) {
    this.onNavigate.emit(id);
  }

}
