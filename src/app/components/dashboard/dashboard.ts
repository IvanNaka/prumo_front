import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartData {
  name: string;
  valor: number;
  esforco: number;
}

interface Projeto {
  id: number;
  nome: string;
  prioridade: 'alta' | 'media' | 'baixa';
  responsavel: string;
}

interface Alerta {
  id: number;
  tipo: 'error' | 'warning' | 'success';
  mensagem: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true
})
export class Dashboard {
  chartData: ChartData[] = [
    { name: 'Jan', valor: 65, esforco: 28 },
    { name: 'Fev', valor: 78, esforco: 35 },
    { name: 'Mar', valor: 90, esforco: 42 },
    { name: 'Abr', valor: 81, esforco: 38 },
    { name: 'Mai', valor: 95, esforco: 45 },
  ];

  projetosCriticos: Projeto[] = [
    { id: 1, nome: 'Plataforma Mobile', prioridade: 'alta', responsavel: 'João Silva' },
    { id: 2, nome: 'API de Integração', prioridade: 'alta', responsavel: 'Maria Santos' },
    { id: 3, nome: 'Dashboard Analytics', prioridade: 'media', responsavel: 'Pedro Costa' },
  ];

  alertas: Alerta[] = [
    { id: 1, tipo: 'error', mensagem: 'Projeto A desalinhado com OKR principal' },
    { id: 2, tipo: 'warning', mensagem: 'Projeto B com risco elevado detectado' },
    { id: 3, tipo: 'error', mensagem: 'Dados inconsistentes na integração' },
  ];

  getPrioridadeClass(prioridade: string): string {
    switch(prioridade) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baixa': return 'priority-low';
      default: return 'priority-default';
    }
  }

  getAlertaClass(tipo: string): string {
    switch(tipo) {
      case 'error': return 'alert-error';
      case 'warning': return 'alert-warning';
      case 'success': return 'alert-success';
      default: return 'alert-default';
    }
  }
}
