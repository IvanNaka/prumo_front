// Enums do domínio (Seção 3.1 do plano de conformidade). Os valores são idênticos aos do back-end,
// que os serializa como texto.

export type Role =
  | 'Desenvolvedor'
  | 'QA'
  | 'ProductOwner'
  | 'TechLead'
  | 'GerenteProjeto'
  | 'Diretoria'
  | 'Administrador';

export type ProjetoStatus =
  | 'Rascunho'
  | 'Planejado'
  | 'EmAndamento'
  | 'EmRisco'
  | 'Suspenso'
  | 'Concluido'
  | 'Cancelado'
  | 'Arquivado';

export type PortfolioStatus =
  | 'Criado'
  | 'Configurado'
  | 'EmAnalise'
  | 'Priorizado'
  | 'Monitoramento'
  | 'Reavaliacao'
  | 'Encerrado';

export type AvaliacaoStatus =
  | 'NaoAvaliado'
  | 'Avaliando'
  | 'Priorizado'
  | 'Reavaliado'
  | 'Aprovado'
  | 'Rejeitado';

export type Prioridade = 'Baixa' | 'Media' | 'Alta' | 'Critica';

export type CategoriaEstrategica = 'Run' | 'Grow' | 'Transform';

export type TipoCriterio = 'Beneficio' | 'Custo';

export type TipoNotificacao = 'Atraso' | 'Risco' | 'Conflito' | 'Desalinhamento' | 'EstouroOrcamento';

export type NotificacaoStatus = 'Gerada' | 'Enfileirada' | 'Enviada' | 'Lida' | 'Ignorada' | 'Arquivada';

export type IntegracaoStatus =
  | 'NaoConfigurada'
  | 'Configurada'
  | 'TestandoConexao'
  | 'Conectada'
  | 'ErroConexao'
  | 'Sincronizando'
  | 'FalhaSincronizacao';

export type TipoIssue = 'Story' | 'Task' | 'Feature' | 'Bug';

export type TipoLancamento = 'Custo' | 'Despesa';

export const ROLES: readonly Role[] = [
  'Desenvolvedor',
  'QA',
  'ProductOwner',
  'TechLead',
  'GerenteProjeto',
  'Diretoria',
  'Administrador',
];

export const PROJETO_STATUS: readonly ProjetoStatus[] = [
  'Rascunho',
  'Planejado',
  'EmAndamento',
  'EmRisco',
  'Suspenso',
  'Concluido',
  'Cancelado',
  'Arquivado',
];

export const PRIORIDADES: readonly Prioridade[] = ['Baixa', 'Media', 'Alta', 'Critica'];

export const CATEGORIAS: readonly CategoriaEstrategica[] = ['Run', 'Grow', 'Transform'];

export const TIPOS_CRITERIO: readonly TipoCriterio[] = ['Beneficio', 'Custo'];

export const TIPOS_NOTIFICACAO: readonly TipoNotificacao[] = [
  'Atraso',
  'Risco',
  'Conflito',
  'Desalinhamento',
  'EstouroOrcamento',
];

export const NOTIFICACAO_STATUS: readonly NotificacaoStatus[] = [
  'Gerada',
  'Enfileirada',
  'Enviada',
  'Lida',
  'Ignorada',
  'Arquivada',
];

export const TIPOS_LANCAMENTO: readonly TipoLancamento[] = ['Custo', 'Despesa'];
