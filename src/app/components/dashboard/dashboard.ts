import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type HealthLabel = 'Em ordem' | 'Em risco' | 'Crítico';
type StrategicLabel = 'Run' | 'Grow' | 'Transform';
type AreaLabel = 'Digital' | 'Financeira' | 'Dados' | 'Operações' | 'Segurança' | 'Comercial';
type YearLabel = 2025 | 2026;
type QuarterLabel = 'T1' | 'T2' | 'T3' | 'T4';

interface PortfolioRecord {
  project: string;
  area: AreaLabel;
  strategy: StrategicLabel;
  year: YearLabel;
  quarter: QuarterLabel;
  month: string;
  monthOrder: number;
  health: HealthLabel;
  manager: string;
  delayReason: string;
  team: string;
  objective: string;
  budgetTotal: number;
  budgetSpent: number;
  promisedReturn: number;
  realizedReturn: number;
  progressPercent: number;
  allocation: number;
  features: number;
  bugs: number;
  leadTimeDays: number;
}

interface HealthStatus {
  label: HealthLabel;
  value: number;
  color: string;
}

interface StrategicBucket {
  name: StrategicLabel;
  value: number;
  color: string;
}

interface OkrInvestment {
  objective: string;
  value: number;
  color: string;
}

interface Utilization {
  team: string;
  allocation: number;
}

interface MonthlyEffort {
  month: string;
  monthOrder: number;
  features: number;
  bugs: number;
}

interface LeadTime {
  month: string;
  monthOrder: number;
  days: number;
}

interface FilterOption<T extends string | number> {
  label: string;
  value: T | 'Todos';
}

const PORTFOLIO_RECORDS: PortfolioRecord[] = [
  {
    project: 'Plataforma Onboarding',
    area: 'Digital',
    strategy: 'Grow',
    year: 2026,
    quarter: 'T1',
    month: 'Jan',
    monthOrder: 1,
    health: 'Crítico',
    manager: 'Ana Rocha',
    delayReason: 'Dependência do ERP atrasou a homologação.',
    team: 'Squad Canais Digitais',
    objective: 'Expansão de Receita',
    budgetTotal: 3200000,
    budgetSpent: 2400000,
    promisedReturn: 1100000,
    realizedReturn: 200000,
    progressPercent: 54,
    allocation: 112,
    features: 68,
    bugs: 32,
    leadTimeDays: 19,
  },
  {
    project: 'Modernização Core',
    area: 'Financeira',
    strategy: 'Run',
    year: 2026,
    quarter: 'T1',
    month: 'Feb',
    monthOrder: 2,
    health: 'Em risco',
    manager: 'Bruno Lima',
    delayReason: 'Janela de implantação reduzida por congelamento de mudanças.',
    team: 'Squad Core Banking',
    objective: 'Eficiência Operacional',
    budgetTotal: 4100000,
    budgetSpent: 3100000,
    promisedReturn: 1500000,
    realizedReturn: 500000,
    progressPercent: 61,
    allocation: 118,
    features: 62,
    bugs: 38,
    leadTimeDays: 21,
  },
  {
    project: 'Data Lake Comercial',
    area: 'Dados',
    strategy: 'Transform',
    year: 2026,
    quarter: 'T1',
    month: 'Feb',
    monthOrder: 2,
    health: 'Em ordem',
    manager: 'Carla Mendes',
    delayReason: '',
    team: 'Squad Dados e IA',
    objective: 'Dados e IA',
    budgetTotal: 2800000,
    budgetSpent: 1400000,
    promisedReturn: 800000,
    realizedReturn: 400000,
    progressPercent: 70,
    allocation: 124,
    features: 80,
    bugs: 20,
    leadTimeDays: 16,
  },
  {
    project: 'API Parceiros',
    area: 'Operações',
    strategy: 'Grow',
    year: 2026,
    quarter: 'T2',
    month: 'Apr',
    monthOrder: 4,
    health: 'Crítico',
    manager: 'Daniel Freitas',
    delayReason: 'Integração externa atrasou entregas críticas.',
    team: 'Squad Integrações',
    objective: 'Conformidade e Segurança',
    budgetTotal: 2200000,
    budgetSpent: 1900000,
    promisedReturn: 700000,
    realizedReturn: 150000,
    progressPercent: 49,
    allocation: 108,
    features: 54,
    bugs: 46,
    leadTimeDays: 24,
  },
  {
    project: 'Portal Clientes',
    area: 'Digital',
    strategy: 'Grow',
    year: 2026,
    quarter: 'T2',
    month: 'May',
    monthOrder: 5,
    health: 'Em ordem',
    manager: 'Elisa Campos',
    delayReason: '',
    team: 'Squad Canais Digitais',
    objective: 'Experiência do Cliente',
    budgetTotal: 3800000,
    budgetSpent: 2100000,
    promisedReturn: 1700000,
    realizedReturn: 900000,
    progressPercent: 77,
    allocation: 95,
    features: 75,
    bugs: 25,
    leadTimeDays: 13,
  },
  {
    project: 'Segurança IAM',
    area: 'Segurança',
    strategy: 'Run',
    year: 2026,
    quarter: 'T2',
    month: 'May',
    monthOrder: 5,
    health: 'Em risco',
    manager: 'Fernando Alves',
    delayReason: 'Validação manual elevou o lead time.',
    team: 'Squad Segurança',
    objective: 'Conformidade e Segurança',
    budgetTotal: 1900000,
    budgetSpent: 1300000,
    promisedReturn: 600000,
    realizedReturn: 200000,
    progressPercent: 63,
    allocation: 69,
    features: 61,
    bugs: 39,
    leadTimeDays: 17,
  },
  {
    project: 'Automação Financeira',
    area: 'Financeira',
    strategy: 'Transform',
    year: 2026,
    quarter: 'T3',
    month: 'Jul',
    monthOrder: 7,
    health: 'Em ordem',
    manager: 'Gabriela Souza',
    delayReason: '',
    team: 'Squad Plataforma',
    objective: 'Eficiência Operacional',
    budgetTotal: 2600000,
    budgetSpent: 1600000,
    promisedReturn: 1200000,
    realizedReturn: 600000,
    progressPercent: 74,
    allocation: 78,
    features: 78,
    bugs: 22,
    leadTimeDays: 14,
  },
  {
    project: 'Expansão LATAM',
    area: 'Comercial',
    strategy: 'Grow',
    year: 2026,
    quarter: 'T3',
    month: 'Aug',
    monthOrder: 8,
    health: 'Crítico',
    manager: 'Henrique Nunes',
    delayReason: 'Atraso em aprovações regulatórias de mercado.',
    team: 'Squad Core Banking',
    objective: 'Expansão de Receita',
    budgetTotal: 4500000,
    budgetSpent: 3800000,
    promisedReturn: 2200000,
    realizedReturn: 300000,
    progressPercent: 47,
    allocation: 113,
    features: 57,
    bugs: 43,
    leadTimeDays: 26,
  },
  {
    project: 'Observabilidade',
    area: 'Operações',
    strategy: 'Run',
    year: 2025,
    quarter: 'T4',
    month: 'Nov',
    monthOrder: 11,
    health: 'Em ordem',
    manager: 'Iara Pinto',
    delayReason: '',
    team: 'Squad Plataforma',
    objective: 'Eficiência Operacional',
    budgetTotal: 1700000,
    budgetSpent: 1100000,
    promisedReturn: 500000,
    realizedReturn: 300000,
    progressPercent: 81,
    allocation: 82,
    features: 74,
    bugs: 26,
    leadTimeDays: 11,
  },
  {
    project: 'App Mobile',
    area: 'Digital',
    strategy: 'Grow',
    year: 2025,
    quarter: 'T4',
    month: 'Dec',
    monthOrder: 12,
    health: 'Crítico',
    manager: 'João Pereira',
    delayReason: 'Faltou homologação do gateway de pagamento.',
    team: 'Squad Canais Digitais',
    objective: 'Experiência do Cliente',
    budgetTotal: 2900000,
    budgetSpent: 2500000,
    promisedReturn: 1300000,
    realizedReturn: 100000,
    progressPercent: 44,
    allocation: 101,
    features: 58,
    bugs: 42,
    leadTimeDays: 23,
  },
  {
    project: 'MLOps Preditivo',
    area: 'Dados',
    strategy: 'Transform',
    year: 2026,
    quarter: 'T1',
    month: 'Mar',
    monthOrder: 3,
    health: 'Em risco',
    manager: 'Karla Reis',
    delayReason: 'Ambiente de testes limitado para pipelines.',
    team: 'Squad Dados e IA',
    objective: 'Dados e IA',
    budgetTotal: 2100000,
    budgetSpent: 1700000,
    promisedReturn: 900000,
    realizedReturn: 200000,
    progressPercent: 57,
    allocation: 119,
    features: 66,
    bugs: 34,
    leadTimeDays: 18,
  },
  {
    project: 'Compliance Tributária',
    area: 'Financeira',
    strategy: 'Run',
    year: 2026,
    quarter: 'T2',
    month: 'Apr',
    monthOrder: 4,
    health: 'Crítico',
    manager: 'Lucas Moraes',
    delayReason: 'Dependência de regra fiscal externa atrasou a validação.',
    team: 'Squad Core Banking',
    objective: 'Conformidade e Segurança',
    budgetTotal: 3300000,
    budgetSpent: 2900000,
    promisedReturn: 1100000,
    realizedReturn: 50000,
    progressPercent: 41,
    allocation: 126,
    features: 52,
    bugs: 48,
    leadTimeDays: 28,
  },
];

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  readonly selectedArea = signal<'Todos' | AreaLabel>('Todos');
  readonly selectedStrategy = signal<'Todos' | StrategicLabel>('Todos');
  readonly selectedYear = signal<'Todos' | YearLabel>('Todos');
  readonly selectedQuarter = signal<'Todos' | QuarterLabel>('Todos');
  readonly focusedHealthSlice = signal<HealthLabel | null>(null);

  readonly areaOptions = signal<FilterOption<AreaLabel>[]>([
    { label: 'Todas as áreas', value: 'Todos' },
    { label: 'Digital', value: 'Digital' },
    { label: 'Financeira', value: 'Financeira' },
    { label: 'Dados', value: 'Dados' },
    { label: 'Operações', value: 'Operações' },
    { label: 'Segurança', value: 'Segurança' },
    { label: 'Comercial', value: 'Comercial' },
  ]);

  readonly strategyOptions = signal<FilterOption<StrategicLabel>[]>([
    { label: 'Todas', value: 'Todos' },
    { label: 'Run', value: 'Run' },
    { label: 'Grow', value: 'Grow' },
    { label: 'Transform', value: 'Transform' },
  ]);

  readonly yearOptions = signal<FilterOption<YearLabel>[]>([
    { label: 'Todos os anos', value: 'Todos' },
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 },
  ]);

  readonly quarterOptions = signal<FilterOption<QuarterLabel>[]>([
    { label: 'Todos os trimestres', value: 'Todos' },
    { label: 'T1', value: 'T1' },
    { label: 'T2', value: 'T2' },
    { label: 'T3', value: 'T3' },
    { label: 'T4', value: 'T4' },
  ]);

  readonly filteredRecords = computed(() =>
    PORTFOLIO_RECORDS.filter((record) => {
      const matchesArea = this.selectedArea() === 'Todos' || record.area === this.selectedArea();
      const matchesStrategy =
        this.selectedStrategy() === 'Todos' || record.strategy === this.selectedStrategy();
      const matchesYear = this.selectedYear() === 'Todos' || record.year === this.selectedYear();
      const matchesQuarter =
        this.selectedQuarter() === 'Todos' || record.quarter === this.selectedQuarter();

      return matchesArea && matchesStrategy && matchesYear && matchesQuarter;
    })
  );

  readonly healthStatus = computed<HealthStatus[]>(() => {
    const labels: HealthLabel[] = ['Em ordem', 'Em risco', 'Crítico'];
    const colors: Record<HealthLabel, string> = {
      'Em ordem': '#15803d',
      'Em risco': '#d97706',
      Crítico: '#b91c1c',
    };

    return labels.map((label) => ({
      label,
      value: this.filteredRecords().filter((record) => record.health === label).length,
      color: colors[label],
    }));
  });

  readonly portfolioTotal = computed(() => this.filteredRecords().length);

  readonly burnRate = computed(() => {
    const records = this.filteredRecords();
    const totalBudget = records.reduce((sum, record) => sum + record.budgetTotal, 0);
    const spentBudget = records.reduce((sum, record) => sum + record.budgetSpent, 0);
    const averageCompletion =
      records.length === 0
        ? 0
        : Math.round(records.reduce((sum, record) => sum + record.progressPercent, 0) / records.length);

    return {
      budgetUsedPercent: totalBudget === 0 ? 0 : Math.round((spentBudget / totalBudget) * 100),
      completionPercent: averageCompletion,
      budgetTotal: totalBudget,
      budgetSpent: spentBudget,
    };
  });

  readonly realizedReturn = computed(() => {
    const records = this.filteredRecords();
    const promised = records.reduce((sum, record) => sum + record.promisedReturn, 0);
    const realized = records.reduce((sum, record) => sum + record.realizedReturn, 0);

    return {
      promised,
      realized,
      ratioPercent: promised === 0 ? 0 : Math.round((realized / promised) * 100),
    };
  });

  readonly strategicAllocation = computed<StrategicBucket[]>(() => {
    const colors: Record<StrategicLabel, string> = {
      Run: '#2563eb',
      Grow: '#0f766e',
      Transform: '#7c3aed',
    };

    const labels: StrategicLabel[] = ['Run', 'Grow', 'Transform'];

    return labels.map((name) => ({
      name,
      value: this.filteredRecords()
        .filter((record) => record.strategy === name)
        .reduce((sum, record) => sum + record.budgetTotal, 0),
      color: colors[name],
    }));
  });

  readonly okrInvestments = computed<OkrInvestment[]>(() => {
    const objectiveOrder = [
      'Eficiência Operacional',
      'Expansão de Receita',
      'Conformidade e Segurança',
      'Experiência do Cliente',
      'Dados e IA',
    ];

    const colors: Record<string, string> = {
      'Eficiência Operacional': '#0e7490',
      'Expansão de Receita': '#16a34a',
      'Conformidade e Segurança': '#1d4ed8',
      'Experiência do Cliente': '#db2777',
      'Dados e IA': '#7c3aed',
    };

    return objectiveOrder.map((objective) => ({
      objective,
      value: this.filteredRecords()
        .filter((record) => record.objective === objective)
        .reduce((sum, record) => sum + record.budgetTotal, 0),
      color: colors[objective],
    }));
  });

  readonly utilization = computed<Utilization[]>(() => {
    const records = this.filteredRecords();
    const teams = Array.from(new Set(records.map((record) => record.team)));

    return teams.map((team) => {
      const teamRecords = records.filter((record) => record.team === team);

      return {
        team,
        allocation:
          teamRecords.length === 0
            ? 0
            : Math.round(
                teamRecords.reduce((sum, record) => sum + record.allocation, 0) / teamRecords.length
              ),
      };
    });
  });

  readonly bugVsFeature = computed<MonthlyEffort[]>(() => {
    const series = new Map<string, MonthlyEffort>();

    for (const record of this.filteredRecords()) {
      const current = series.get(record.month) ?? {
        month: record.month,
        monthOrder: record.monthOrder,
        features: 0,
        bugs: 0,
      };

      current.features += record.features;
      current.bugs += record.bugs;
      series.set(record.month, current);
    }

    return Array.from(series.values()).sort((left, right) => left.monthOrder - right.monthOrder);
  });

  readonly leadTime = computed<LeadTime[]>(() => {
    const series = new Map<string, { month: string; monthOrder: number; days: number[] }>();

    for (const record of this.filteredRecords()) {
      const current = series.get(record.month) ?? {
        month: record.month,
        monthOrder: record.monthOrder,
        days: [],
      };

      current.days.push(record.leadTimeDays);
      series.set(record.month, current);
    }

    return Array.from(series.values())
      .sort((left, right) => left.monthOrder - right.monthOrder)
      .map((item) => ({
        month: item.month,
        monthOrder: item.monthOrder,
        days: Math.round(item.days.reduce((sum, value) => sum + value, 0) / item.days.length),
      }));
  });

  readonly maxLeadTime = computed(() => Math.max(...this.leadTime().map((item) => item.days), 1));
  readonly maxOkrValue = computed(() => Math.max(...this.okrInvestments().map((item) => item.value), 1));

  readonly strategicGradient = computed(() => {
    const buckets = this.strategicAllocation();
    const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0) || 1;
    let offset = 0;

    return `conic-gradient(${buckets
      .map((bucket) => {
        const start = offset;
        const portion = (bucket.value / total) * 100;
        offset += portion;
        return `${bucket.color} ${start}% ${offset}%`;
      })
      .join(', ')})`;
  });

  readonly criticalProjects = computed(() =>
    this.filteredRecords().filter((record) => record.health === 'Crítico')
  );

  readonly drilldownOpen = computed(() => this.focusedHealthSlice() === 'Crítico');

  readonly filtersSummary = computed(() => ({
    area: this.selectedArea(),
    strategy: this.selectedStrategy(),
    year: this.selectedYear(),
    quarter: this.selectedQuarter(),
  }));

  setArea(area: 'Todos' | AreaLabel): void {
    this.selectedArea.set(area);
    this.closeDrilldown();
  }

  setAreaValue(value: string): void {
    this.setArea(value === 'Todos' ? 'Todos' : (value as AreaLabel));
  }

  setStrategy(strategy: 'Todos' | StrategicLabel): void {
    this.selectedStrategy.set(strategy);
    this.closeDrilldown();
  }

  setStrategyValue(value: string): void {
    this.setStrategy(value === 'Todos' ? 'Todos' : (value as StrategicLabel));
  }

  setYear(year: 'Todos' | YearLabel): void {
    this.selectedYear.set(year);
    this.closeDrilldown();
  }

  setYearValue(value: string): void {
    this.setYear(value === 'Todos' ? 'Todos' : (Number(value) as YearLabel));
  }

  setQuarter(quarter: 'Todos' | QuarterLabel): void {
    this.selectedQuarter.set(quarter);
    this.closeDrilldown();
  }

  setQuarterValue(value: string): void {
    this.setQuarter(value === 'Todos' ? 'Todos' : (value as QuarterLabel));
  }

  openCriticalDrilldown(): void {
    this.focusedHealthSlice.set('Crítico');
  }

  closeDrilldown(): void {
    this.focusedHealthSlice.set(null);
  }

  getDonutStrokeDasharray(value: number): string {
    const circumference = 2 * Math.PI * 45;
    const total = this.portfolioTotal() || 1;
    const stroke = (value / total) * circumference;
    return `${stroke} ${circumference - stroke}`;
  }

  getDonutOffset(index: number): number {
    const circumference = 2 * Math.PI * 45;
    const total = this.portfolioTotal() || 1;
    const previous = this.healthStatus()
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    return -((previous / total) * circumference);
  }

  utilizationColor(allocation: number): string {
    if (allocation >= 110) {
      return '#b91c1c';
    }

    if (allocation >= 100) {
      return '#d97706';
    }

    if (allocation >= 85) {
      return '#15803d';
    }

    return '#2563eb';
  }

  utilizationLabel(allocation: number): string {
    if (allocation >= 110) {
      return 'Sobrecarga';
    }

    if (allocation >= 100) {
      return 'No limite';
    }

    if (allocation >= 85) {
      return 'Saudável';
    }

    return 'Ocioso';
  }

  teamBarHeight(allocation: number): number {
    return Math.min(allocation, 130);
  }

  effortPoints(type: 'features' | 'bugs'): string {
    const series = this.bugVsFeature();

    if (!series.length) {
      return '';
    }

    const maxValue = Math.max(...series.map((item) => Math.max(item.features, item.bugs)), 1);
    const xStep = 100 / Math.max(series.length - 1, 1);

    return series
      .map((item, index) => {
        const x = index * xStep;
        const y = 100 - (item[type] / maxValue) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }

  barHeight(days: number): number {
    return Math.round((days / this.maxLeadTime()) * 100);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
