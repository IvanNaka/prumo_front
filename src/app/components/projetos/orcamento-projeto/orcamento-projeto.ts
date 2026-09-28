import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Budget,
  BudgetExpense,
  BudgetExpenseCategory,
  BudgetMetrics,
  BudgetService,
  CreateBudgetExpenseDto,
} from '../../../services/budgetService';

@Component({
  selector: 'app-orcamento-projeto',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orcamento-projeto.html',
  styleUrl: './orcamento-projeto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrcamentoProjeto {
  private readonly fb = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);

  readonly projectId = input.required<string>();

  readonly expenseCategories = [
    { value: BudgetExpenseCategory.Custo, label: 'Custo' },
    { value: BudgetExpenseCategory.Despesa, label: 'Despesa' },
  ];

  readonly isLoadingBudget = signal(true);
  readonly budget = signal<Budget | null>(null);
  readonly budgetSubmitted = signal(false);
  readonly budgetSaveError = signal(false);
  readonly budgetSaving = signal(false);

  readonly expenses = signal<BudgetExpense[]>([]);
  readonly isLoadingExpenses = signal(false);
  readonly expenseSubmitted = signal(false);
  readonly expenseSaveError = signal(false);
  readonly expenseSaving = signal(false);

  readonly metrics = signal<BudgetMetrics | null>(null);
  readonly isLoadingMetrics = signal(false);
  readonly metricsError = signal(false);

  readonly budgetForm = this.fb.nonNullable.group({
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['BRL', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    discountRateMonthly: [0, [Validators.required, Validators.min(0)]],
    expectedReturn: [0, [Validators.required, Validators.min(0)]],
  });

  readonly expenseForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
    category: [BudgetExpenseCategory.Custo, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const id = this.projectId();
      if (id) {
        this.loadBudget(id);
      }
    });
  }

  get budgetControls() {
    return this.budgetForm.controls;
  }

  get expenseControls() {
    return this.expenseForm.controls;
  }

  private loadBudget(projectId: string): void {
    this.isLoadingBudget.set(true);

    this.budgetService.getBudgetByProject(projectId).subscribe({
      next: (budget) => {
        this.budget.set(budget);
        this.budgetForm.patchValue({
          totalAmount: budget.totalAmount,
          currency: budget.currency,
          startDate: budget.startDate?.slice(0, 10) ?? '',
          endDate: budget.endDate?.slice(0, 10) ?? '',
          discountRateMonthly: budget.discountRateMonthly,
          expectedReturn: budget.expectedReturn,
        });
        this.isLoadingBudget.set(false);
        this.loadExpenses(budget.id);
        this.loadMetrics(budget.id);
      },
      error: () => {
        this.budget.set(null);
        this.isLoadingBudget.set(false);
      },
    });
  }

  private loadExpenses(budgetId: string): void {
    this.isLoadingExpenses.set(true);

    this.budgetService.getExpenses(budgetId).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.isLoadingExpenses.set(false);
      },
      error: () => {
        this.expenses.set([]);
        this.isLoadingExpenses.set(false);
      },
    });
  }

  private loadMetrics(budgetId: string): void {
    this.isLoadingMetrics.set(true);
    this.metricsError.set(false);

    this.budgetService.getBudgetMetrics(budgetId).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.isLoadingMetrics.set(false);
      },
      error: () => {
        this.metrics.set(null);
        this.metricsError.set(true);
        this.isLoadingMetrics.set(false);
      },
    });
  }

  onSubmitBudget(): void {
    this.budgetSubmitted.set(true);
    this.budgetSaveError.set(false);

    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const values = this.budgetForm.getRawValue();
    const existing = this.budget();
    this.budgetSaving.set(true);

    if (existing) {
      this.budgetService.updateBudget(existing.id, values).subscribe({
        next: () => {
          this.budget.set({ ...existing, ...values });
          this.budgetSaving.set(false);
          this.budgetSubmitted.set(false);
          this.loadMetrics(existing.id);
        },
        error: () => {
          this.budgetSaveError.set(true);
          this.budgetSaving.set(false);
        },
      });
      return;
    }

    this.budgetService.createBudget({ projectId: this.projectId(), ...values }).subscribe({
      next: (created) => {
        this.budget.set(created);
        this.budgetSaving.set(false);
        this.budgetSubmitted.set(false);
        this.loadExpenses(created.id);
        this.loadMetrics(created.id);
      },
      error: () => {
        this.budgetSaveError.set(true);
        this.budgetSaving.set(false);
      },
    });
  }

  onSubmitExpense(): void {
    this.expenseSubmitted.set(true);
    this.expenseSaveError.set(false);

    const currentBudget = this.budget();
    if (this.expenseForm.invalid || !currentBudget) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const dto: CreateBudgetExpenseDto = this.expenseForm.getRawValue();
    this.expenseSaving.set(true);

    this.budgetService.createExpense(currentBudget.id, dto).subscribe({
      next: (expense) => {
        this.expenses.update((current) => [expense, ...current]);
        this.expenseForm.reset({
          description: '',
          category: BudgetExpenseCategory.Custo,
          amount: 0,
          date: '',
        });
        this.expenseSubmitted.set(false);
        this.expenseSaving.set(false);
        this.loadMetrics(currentBudget.id);
      },
      error: () => {
        this.expenseSaveError.set(true);
        this.expenseSaving.set(false);
      },
    });
  }

  removeExpense(expenseId: string): void {
    const currentBudget = this.budget();
    if (!currentBudget) {
      return;
    }

    this.budgetService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.expenses.update((current) => current.filter((expense) => expense.id !== expenseId));
        this.loadMetrics(currentBudget.id);
      },
    });
  }

  categoryLabel(category: BudgetExpenseCategory): string {
    return category === BudgetExpenseCategory.Despesa ? 'Despesa' : 'Custo';
  }

  formatCurrency(value: number | undefined | null): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.budget()?.currency ?? 'BRL',
      maximumFractionDigits: 2,
    }).format(value ?? 0);
  }
}
