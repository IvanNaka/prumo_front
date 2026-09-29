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
