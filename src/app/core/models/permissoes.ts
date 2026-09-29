import { Role } from './enums';

/**
 * Matriz de perfis e permissões (Seção 3.6 do plano / RF02), do ponto de vista do front-end.
 * "Todos" = todos os perfis. O Administrador tem permissão em tudo (tratado no AuthService).
 * Estas listas decidem o que aparece na tela; o back-end aplica as mesmas regras (policies).
 */
export const TODOS: readonly Role[] = [
  'Desenvolvedor',
  'QA',
  'ProductOwner',
  'TechLead',
  'GerenteProjeto',
  'Diretoria',
  'Administrador',
];

export const PERMISSOES = {
  // Portfólio: criar/editar
  editarPortfolio: ['ProductOwner', 'GerenteProjeto'] as Role[],
  // Portfólio: aprovar / reavaliar / encerrar
  governarPortfolio: ['GerenteProjeto', 'Diretoria'] as Role[],
  // Critérios (UC4–UC6)
  editarCriterios: ['ProductOwner'] as Role[],
  // Projetos: criar/editar/status (UC7, RF13)
  editarProjetos: ['GerenteProjeto'] as Role[],
  // Avaliar / priorizar / aprovar avaliação (UC10)
  priorizar: ['ProductOwner'] as Role[],
  // OKRs e associações (UC8, UC9)
  editarOkrs: ['ProductOwner'] as Role[],
  // Financeiro: ver (lançamentos e business case)
  verFinanceiro: ['ProductOwner', 'GerenteProjeto', 'Diretoria'] as Role[],
  // Financeiro: editar
  editarFinanceiro: ['GerenteProjeto'] as Role[],
  // Dependências (UC12)
  editarDependencias: ['TechLead', 'GerenteProjeto'] as Role[],
  // Equipes e capacidade (UC13)
  editarEquipes: ['TechLead'] as Role[],
  // Integrações (UC15, UC16)
  integracoes: ['Desenvolvedor'] as Role[],
  // Relatórios (RF43, RF44): PO visualiza; Gerente e Diretoria geram
  verRelatorios: ['ProductOwner', 'GerenteProjeto', 'Diretoria'] as Role[],
  // Usuários (RF03)
  gerirUsuarios: ['Administrador'] as Role[],
} as const;
