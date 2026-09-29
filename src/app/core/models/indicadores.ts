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

/** F7 — Lead Time. */
export interface LeadTime extends Indicador {
  quantidade: number;
  leadTimeMediano: number;
  leadTimeMedio: number;
  p85: number;
}

/** F8 — Qualidade da entrega. */
export interface Qualidade extends Indicador {
  bugs: number;
  entregas: number;
  razaoBugsPorEntrega: number;
  indiceQualidade: number;
  metaRazao: number;
  atingiuMeta: boolean;
  porTipo: Record<string, number>;
}

export type ClassificacaoSaude = 'Saudável' | 'Atenção' | 'Crítico';

/** F12 — saúde de um projeto. */
export interface SaudeProjeto extends Indicador {
  projetoId: string;
  nome: string;
  status: string;
  totalIssues: number;
  concluidas: number;
  atrasadas: number;
  progresso: number | null;
  flags: string[];
  pontuacaoSaude: number;
  classificacao: ClassificacaoSaude;
}

/** F12 — saúde do portfólio. */
export interface Saude extends Indicador {
  saude: number;
  classificacao: ClassificacaoSaude | null;
  contagem: Record<ClassificacaoSaude, number>;
  projetos: SaudeProjeto[];
}

/** F10 — alocação estratégica. */
export interface Alocacao extends Indicador {
  orcamentoTotal: number;
  categorias: { categoria: string; quantidade: number; orcamento: number; percentualOrcamento: number }[];
}

/** F9 — capacidade (equipe, membro ou portfólio). */
export interface CapacidadeIndicador extends Indicador {
  equipeId?: string | null;
  equipeNome?: string | null;
  mes: string;
  capacidade: number;
  demanda: number;
  ocupacao: number;
  horasMes: number;
  utilizacao: number;
  classificacao?: 'Subutilizada' | 'Adequada' | 'Sobrecarregada' | null;
  equipes?: CapacidadeIndicador[] | null;
}

/** F11 — alinhamento a OKRs. */
export interface AlinhamentoOkr extends Indicador {
  totalProjetos: number;
  projetosAlinhados: number;
  percentualProjetosAlinhados: number;
  percentualOrcamentoAlinhado: number | null;
  listaDesalinhados: { projetoId: string; nome: string; orcamentoAprovado: number }[];
  progressoPorOkr: { okrId: string; titulo: string; progresso: number }[];
}

/** GET /portfolios/{id}/dashboard — as 8 chaves. */
export interface Dashboard {
  de: string;
  ate: string;
  ultimaSincronizacaoJira: string | null;
  burnRate: BurnRate;
  saude: Saude;
  alocacaoEstrategica: Alocacao;
  qualidade: Qualidade;
  capacidade: CapacidadeIndicador;
  leadTime: LeadTime;
  vpl: Vpl;
  alinhamentoOkr: AlinhamentoOkr;
}

/** GET /projetos/{id}/indicadores — F5, F6, F7, F8 e F12. */
export interface IndicadoresProjeto {
  de: string;
  ate: string;
  burnRate: BurnRate;
  vpl: Vpl;
  leadTime: LeadTime;
  qualidade: Qualidade;
  saude: SaudeProjeto;
}
