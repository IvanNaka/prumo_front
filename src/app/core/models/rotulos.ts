import {
  AvaliacaoStatus,
  CategoriaEstrategica,
  IntegracaoStatus,
  NotificacaoStatus,
  PortfolioStatus,
  Prioridade,
  ProjetoStatus,
  Role,
  TipoCriterio,
  TipoIssue,
  TipoLancamento,
  TipoNotificacao,
} from './enums';

// Rótulos em português de cada valor de enum, usados somente para exibição.

export const ROTULO_ROLE: Record<Role, string> = {
  Desenvolvedor: 'Desenvolvedor',
  QA: 'QA',
  ProductOwner: 'Product Owner',
  TechLead: 'Tech Lead',
  GerenteProjeto: 'Gerente de Projetos',
  Diretoria: 'Diretoria',
  Administrador: 'Administrador',
};

export const ROTULO_PROJETO_STATUS: Record<ProjetoStatus, string> = {
  Rascunho: 'Rascunho',
  Planejado: 'Planejado',
  EmAndamento: 'Em andamento',
  EmRisco: 'Em risco',
  Suspenso: 'Suspenso',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado',
  Arquivado: 'Arquivado',
};

export const ROTULO_PORTFOLIO_STATUS: Record<PortfolioStatus, string> = {
  Criado: 'Criado',
  Configurado: 'Configurado',
  EmAnalise: 'Em análise',
  Priorizado: 'Priorizado',
  Monitoramento: 'Monitoramento',
  Reavaliacao: 'Reavaliação',
  Encerrado: 'Encerrado',
};

export const ROTULO_AVALIACAO_STATUS: Record<AvaliacaoStatus, string> = {
  NaoAvaliado: 'Não avaliado',
  Avaliando: 'Avaliando',
  Priorizado: 'Priorizado',
  Reavaliado: 'Reavaliado',
  Aprovado: 'Aprovado',
  Rejeitado: 'Rejeitado',
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  Baixa: 'Baixa',
  Media: 'Média',
  Alta: 'Alta',
  Critica: 'Crítica',
};

export const ROTULO_CATEGORIA: Record<CategoriaEstrategica, string> = {
  Run: 'Run',
  Grow: 'Grow',
  Transform: 'Transform',
};

export const DESCRICAO_CATEGORIA: Record<CategoriaEstrategica, string> = {
  Run: 'Manter a operação funcionando',
  Grow: 'Expandir e melhorar o negócio atual',
  Transform: 'Criar novos negócios e capacidades',
};

export const ROTULO_TIPO_CRITERIO: Record<TipoCriterio, string> = {
  Beneficio: 'Benefício',
  Custo: 'Custo',
};

export const ROTULO_TIPO_NOTIFICACAO: Record<TipoNotificacao, string> = {
  Atraso: 'Atraso',
  Risco: 'Risco',
  Conflito: 'Conflito',
  Desalinhamento: 'Desalinhamento',
  EstouroOrcamento: 'Estouro de orçamento',
};

export const ROTULO_NOTIFICACAO_STATUS: Record<NotificacaoStatus, string> = {
  Gerada: 'Gerada',
  Enfileirada: 'Enfileirada',
  Enviada: 'Não lida',
  Lida: 'Lida',
  Ignorada: 'Ignorada',
  Arquivada: 'Arquivada',
};

export const ROTULO_INTEGRACAO_STATUS: Record<IntegracaoStatus, string> = {
  NaoConfigurada: 'Não configurada',
  Configurada: 'Configurada',
  TestandoConexao: 'Testando conexão',
  Conectada: 'Conectada',
  ErroConexao: 'Erro de conexão',
  Sincronizando: 'Sincronizando',
  FalhaSincronizacao: 'Falha na sincronização',
};

export const ROTULO_TIPO_ISSUE: Record<TipoIssue, string> = {
  Story: 'Story',
  Task: 'Task',
  Feature: 'Feature',
  Bug: 'Bug',
};

export const ROTULO_TIPO_LANCAMENTO: Record<TipoLancamento, string> = {
  Custo: 'Custo',
  Despesa: 'Despesa',
};
