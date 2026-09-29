import { PortfolioStatus, Role } from './enums';

export interface Portfolio {
  id: string;
  nome: string;
  descricao?: string | null;
  objetivo?: string | null;
  responsavelId: string;
  responsavelNome: string;
  status: PortfolioStatus;
  dataCriacao: string;
  quantidadeProjetos: number;
  quantidadeCriterios: number;
  quantidadeMembros: number;
}

export interface SalvarPortfolio {
  nome: string;
  descricao?: string | null;
  objetivo?: string | null;
  responsavelId: string;
}

export interface MembroPortfolio {
  usuarioId: string;
  nome: string;
  email: string;
  perfis: Role[];
  responsavel: boolean;
}

export type AcaoPortfolio = 'aprovar' | 'reavaliar' | 'encerrar';

/** Ações manuais disponíveis em cada status (Figura 27). */
export const ACOES_POR_STATUS_PORTFOLIO: Record<PortfolioStatus, AcaoPortfolio[]> = {
  Criado: [],
  Configurado: [],
  EmAnalise: [],
  Priorizado: ['aprovar'],
  Monitoramento: ['reavaliar', 'encerrar'],
  Reavaliacao: [],
  Encerrado: [],
};

export const ROTULO_ACAO_PORTFOLIO: Record<AcaoPortfolio, string> = {
  aprovar: 'Aprovar portfólio',
  reavaliar: 'Reavaliar estratégia',
  encerrar: 'Encerrar portfólio',
};
