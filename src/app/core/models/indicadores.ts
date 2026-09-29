/** Formato comum dos indicadores (Seção 3.5): { disponivel, motivo?, ...valores }. */
export interface Indicador {
  disponivel: boolean;
  motivo?: string | null;
}

export const RN18 = 'Dados insuficientes para calcular este indicador.';

/** F5 — custo realizado e Burn Rate. */
export interface BurnRate extends Indicador {
  projetoId?: string | null;
  projetoNome?: string | null;
  orcamentoAprovado: number;
  custoHoras: number;
  custoLancamentos: number;
  custoRealizado: number;
  horasSemCusto: number;
  mesesDecorridos: number;
  duracaoMeses: number;
  burnRateMensal: number;
  percentualConsumido: number | null;
  saldo: number;
  projecaoCustoTotal: number;
  estouro: boolean;
  riscoEstouro: boolean;
  projetos?: BurnRate[] | null;
}

/** F6 — VPL esperado e realizado. */
export interface Vpl extends Indicador {
  projetoId?: string | null;
  projetoNome?: string | null;
  taxaMensal: number;
  vplEsperado: number;
  vplRealizado: number;
  diferenca: number;
  percentualAtingimento: number | null;
  projetos?: Vpl[] | null;
}

/** GET /projetos/{id}/indicadores. */
export interface IndicadoresProjeto {
  burnRate: BurnRate;
  vpl: Vpl;
}
