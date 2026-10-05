import { TipoCriterio } from './enums';

export interface Criterio {
  id: string;
  portfolioId: string;
  nome: string;
  descricao?: string | null;
  peso: number;
  tipo?: TipoCriterio;
}

export interface SalvarCriterio {
  nome: string;
  descricao?: string | null;
  peso: number;
  tipo: TipoCriterio;
}

export interface PesoCriterio {
  criterioId: string;
  peso: number;
}

/** A soma dos pesos dos critérios de um portfólio deve ser sempre 10. */
export const SOMA_PESOS = 10;
