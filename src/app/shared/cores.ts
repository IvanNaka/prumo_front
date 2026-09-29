import {
  AvaliacaoStatus,
  IntegracaoStatus,
  NotificacaoStatus,
  PortfolioStatus,
  Prioridade,
  ProjetoStatus,
} from '../core/models/enums';

/** Classe CSS de badge para cada status (apenas apresentação). */

export function badgePortfolio(status: PortfolioStatus): string {
  switch (status) {
    case 'Priorizado':
    case 'Monitoramento':
      return 'badge badge-green';
    case 'EmAnalise':
    case 'Configurado':
      return 'badge badge-blue';
    case 'Reavaliacao':
      return 'badge badge-yellow';
    case 'Encerrado':
      return 'badge badge-gray';
    default:
      return 'badge badge-purple';
  }
}

export function badgeProjeto(status: ProjetoStatus): string {
  switch (status) {
    case 'EmAndamento':
      return 'badge badge-blue';
    case 'Concluido':
      return 'badge badge-green';
    case 'EmRisco':
      return 'badge badge-red';
    case 'Suspenso':
      return 'badge badge-yellow';
    case 'Cancelado':
    case 'Arquivado':
      return 'badge badge-gray';
    default:
      return 'badge badge-purple';
  }
}

export function badgeAvaliacao(status: AvaliacaoStatus): string {
  switch (status) {
    case 'Priorizado':
      return 'badge badge-blue';
    case 'Aprovado':
      return 'badge badge-green';
    case 'Rejeitado':
      return 'badge badge-red';
    case 'Reavaliado':
      return 'badge badge-yellow';
    case 'Avaliando':
      return 'badge badge-purple';
    default:
      return 'badge badge-gray';
  }
}

export function badgePrioridade(prioridade: Prioridade): string {
  switch (prioridade) {
    case 'Critica':
      return 'badge badge-red';
    case 'Alta':
      return 'badge badge-yellow';
    case 'Media':
      return 'badge badge-blue';
    default:
      return 'badge badge-gray';
  }
}

export function badgeIntegracao(status: IntegracaoStatus): string {
  switch (status) {
    case 'Conectada':
      return 'badge badge-green';
    case 'Sincronizando':
    case 'TestandoConexao':
      return 'badge badge-blue';
    case 'ErroConexao':
    case 'FalhaSincronizacao':
      return 'badge badge-red';
    case 'Configurada':
      return 'badge badge-yellow';
    default:
      return 'badge badge-gray';
  }
}

export function badgeNotificacao(status: NotificacaoStatus): string {
  switch (status) {
    case 'Enviada':
      return 'badge badge-blue';
    case 'Lida':
      return 'badge badge-green';
    case 'Ignorada':
      return 'badge badge-yellow';
    default:
      return 'badge badge-gray';
  }
}

/** Formata número como moeda BRL. */
export function brl(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata número com 2 casas decimais. */
export function num(valor: number | null | undefined, casas = 2): string {
  return (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
}

/** Formata data ISO (yyyy-mm-dd ou data/hora) como dd/mm/aaaa. */
export function data(valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const d = somenteData ? new Date(`${valor}T00:00:00`) : new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

/** Formata data/hora ISO como dd/mm/aaaa hh:mm. */
export function dataHora(valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? '—'
    : `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
