import { AvaliacaoStatus, CategoriaEstrategica, Prioridade, ProjetoStatus, TipoCriterio } from './enums';

/** Linha da listagem de projetos do portfólio. */
export interface ProjetoResumo {
  id: string;
  portfolioId: string;
  nome: string;
  status: ProjetoStatus;
  responsavelId: string;
  responsavelNome: string;
  dataCriacao: string;
  categoriaEstrategica: CategoriaEstrategica;
  prioridade: Prioridade;
  statusAvaliacao: AvaliacaoStatus;
  scoreAtual: number | null;
  posicaoRanking: number | null;
  orcamentoAprovado: number;
  dataInicio: string;
  dataFim: string;
}

export interface NotaCriterio {
  criterioId: string;
  criterioNome: string;
  peso: number;
  tipo: TipoCriterio;
  nota: number | null;
  avaliadorNome?: string | null;
  dataAvaliacao?: string | null;
}

/** GET /projetos/{id} — detalhe completo. */
export interface ProjetoDetalhe extends ProjetoResumo {
  descricao?: string | null;
  portfolioNome: string;
  portfolioStatus: string;
  jiraProjectKey?: string | null;
  dataConclusao?: string | null;
  dataUltimaPriorizacao?: string | null;
  acoesPermitidas: AcaoProjeto[];
  avaliacoes: NotaCriterio[];
}

export interface SalvarProjeto {
  nome: string;
  descricao?: string | null;
  responsavelId: string;
  dataInicio: string;
  dataFim: string;
  orcamentoAprovado: number;
  categoriaEstrategica: CategoriaEstrategica;
  prioridade: Prioridade;
  jiraProjectKey?: string | null;
}

export type AcaoProjeto =
  | 'Aprovar'
  | 'Iniciar'
  | 'MarcarRisco'
  | 'MitigarRisco'
  | 'Suspender'
  | 'Retomar'
  | 'Finalizar'
  | 'Arquivar'
  | 'Cancelar';

/** Espelho da máquina de estados do projeto (Figura 26 + Cancelar). */
export const ACOES_POR_STATUS: Record<ProjetoStatus, AcaoProjeto[]> = {
  Rascunho: ['Aprovar', 'Cancelar'],
  Planejado: ['Iniciar', 'Cancelar'],
  EmAndamento: ['MarcarRisco', 'Suspender', 'Finalizar', 'Cancelar'],
  EmRisco: ['MitigarRisco', 'Cancelar'],
  Suspenso: ['Retomar', 'Cancelar'],
  Concluido: ['Arquivar'],
  Cancelado: [],
  Arquivado: [],
};

export const ROTULO_ACAO_PROJETO: Record<AcaoProjeto, string> = {
  Aprovar: 'Aprovar',
  Iniciar: 'Iniciar',
  MarcarRisco: 'Marcar risco',
  MitigarRisco: 'Mitigar risco',
  Suspender: 'Suspender',
  Retomar: 'Retomar',
  Finalizar: 'Finalizar',
  Arquivar: 'Arquivar',
  Cancelar: 'Cancelar projeto',
};

/** Cancelado e Arquivado são estados finais: sem edição. */
export function projetoEhFinal(status: ProjetoStatus): boolean {
  return status === 'Cancelado' || status === 'Arquivado';
}
