import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

import { Portfolio, PortfoliosService } from '../../../services/portfoliosService';
import { PriorityCriteria, PriorityCriteriaService } from '../../../services/priorityCriteriaService';
import { ProjectService } from '../../../services/projectService';

@Component({
  selector: 'app-criar-projeto',
  imports: [ReactiveFormsModule],
  templateUrl: './criar-projeto.html',
  styleUrl: './criar-projeto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CriarProjeto {
  private readonly fb = inject(FormBuilder);
  private readonly portfoliosService = inject(PortfoliosService);
  private readonly priorityCriteriaService = inject(PriorityCriteriaService);
  private readonly projectService = inject(ProjectService);

  readonly submitted = signal(false);
  readonly portfolios = signal<Portfolio[]>([]);
  readonly priorityCriteria = signal<PriorityCriteria[]>([]);
  readonly priorityCriteriaValues = signal<Record<string, number>>({});

  readonly projectForm = this.fb.nonNullable.group({
    portfolioId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly projectValues = toSignal(
    this.projectForm.valueChanges.pipe(
      startWith(this.projectForm.getRawValue()),
      map(() => this.projectForm.getRawValue())
    ),
    {
      initialValue: this.projectForm.getRawValue(),
    }
  );

  readonly scoreAverage = computed(() => {
    const criteria = this.priorityCriteria();

    if (!criteria.length) {
      return 0;
    }

    const weightedTotal = criteria.reduce(
      (sum, item) => sum + this.getCriteriaValue(item.id) * item.valueWeight,
      0
    );
    const totalWeight = criteria.reduce((sum, item) => sum + item.valueWeight, 0);

    return totalWeight === 0 ? 0 : Math.round(weightedTotal / totalWeight);
  });

  readonly summaryCriteria = computed(() =>
    this.priorityCriteria().map((criteria) => ({
      id: criteria.id,
      name: criteria.name || 'Sem nome',
      value: this.getCriteriaValue(criteria.id),
    }))
  );

  readonly summaryCriteriaCount = computed(() => this.summaryCriteria().length);

  readonly highestCriteriaScore = computed(() => {
    const values = this.summaryCriteria().map((item) => item.value);
    return values.length ? Math.max(...values) : 0;
  });

  constructor() {
    this.loadPortfolios();
    this.projectForm.controls.portfolioId.valueChanges.subscribe((portfolioId) => {
      if (!portfolioId) {
        this.priorityCriteria.set([]);
        this.priorityCriteriaValues.set({});
        return;
      }

      this.loadPriorityCriteria(portfolioId);
    });
  }

  get controls() {
    return this.projectForm.controls;
  }

  private loadPortfolios(): void {
    this.portfoliosService.getPortfolios().subscribe({
      next: (portfolios) => this.portfolios.set(portfolios),
      error: () => this.portfolios.set([]),
    });
  }

  private loadPriorityCriteria(portfolioId: string): void {
    this.priorityCriteriaService.getPriorityCriteriaByPortfolio(portfolioId).subscribe({
      next: (criteria) => {
        this.priorityCriteria.set(criteria);

        const currentValues = this.priorityCriteriaValues();
        const nextValues: Record<string, number> = {};

        for (const item of criteria) {
          nextValues[item.id] = currentValues[item.id] ?? 0;
        }

        this.priorityCriteriaValues.set(nextValues);
      },
      error: () => {
        this.priorityCriteria.set([]);
        this.priorityCriteriaValues.set({});
      },
    });
  }

  getCriteriaControlName(criteriaId: string): string {
    return `criteria_${criteriaId}`;
  }

  getCriteriaValue(criteriaId: string): number {
    return this.priorityCriteriaValues()[criteriaId] ?? 0;
  }
  

  onCriteriaValueInput(criteriaId: string, rawValue: string | number): void {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;

    this.priorityCriteriaValues.update((values) => ({
      ...values,
      [criteriaId]: value,
    }));
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const projectValues = this.projectForm.getRawValue();
    const criteriaScores = this.priorityCriteria().map((criteria) => ({
      priorityCriteriaId: criteria.id,
      name: criteria.name,
      value: this.getCriteriaValue(criteria.id),
    }));

    const payload = {
      portfolioId: projectValues.portfolioId,
      name: projectValues.name,
      description: projectValues.description,
      criteriaScores,
    } as any;

    this.projectService.createProject(payload).subscribe({
      next: (created) => {
        console.log('Projeto criado', created);

        this.projectForm.reset({
          portfolioId: '',
          name: '',
          description: '',
        });

        this.priorityCriteria.set([]);
        this.priorityCriteriaValues.set({});

        this.submitted.set(false);
      },
      error: () => {
        console.error('Falha ao criar projeto');
        this.submitted.set(false);
      },
    });
  }
}