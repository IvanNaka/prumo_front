import { AvaliacaoStatus, CategoriaEstrategica, Prioridade, ProjetoStatus } from './enums';

/** Linha da listagem de projetos do portfólio. */
export interface ProjetoResumo {
  id: string;
  portfolioId: string;
  nome: string;
  status: ProjetoStatus;
  responsavelId: string;
  responsavelNome: string;
  dataCriacao: string;
  categoriaEstrategica?: CategoriaEstrategica;
  prioridade?: Prioridade;
  statusAvaliacao?: AvaliacaoStatus;
  scoreAtual?: number | null;
  posicaoRanking?: number | null;
  orcamentoAprovado?: number;
  dataInicio?: string;
  dataFim?: string;
}
