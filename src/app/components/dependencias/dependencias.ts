import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { Portfolio, PortfoliosService } from '../../services/portfoliosService';
import { Project, ProjectService } from '../../services/projectService';
import {
  CreateProjectDependencyDto,
  ProjectDependency,
  ProjectDependencyService,
} from '../../services/projectDependencyService';

const dependencyProjectValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const projectId = control.get('projectId')?.value;
  const dependsOnProjectId = control.get('dependsOnProjectId')?.value;

  if (!projectId || !dependsOnProjectId) {
    return null;
  }

  return projectId === dependsOnProjectId ? { sameProject: true } : null;
};

@Component({
  selector: 'app-dependencias',
  imports: [ReactiveFormsModule],
  templateUrl: './dependencias.html',
  styleUrl: './dependencias.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dependencias {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly portfoliosService = inject(PortfoliosService);
  private readonly projectService = inject(ProjectService);
  private readonly projectDependencyService = inject(ProjectDependencyService);

  readonly submitted = signal(false);
  readonly portfolios = signal<Portfolio[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly dependencies = signal<ProjectDependency[]>([]);
  readonly isLoadingPortfolios = signal(false);
  readonly isLoadingProjects = signal(false);
  readonly isLoadingDependencies = signal(false);
  readonly isSaving = signal(false);
  readonly deletingDependencyId = signal<string | null>(null);
  readonly feedback = signal<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);

  readonly currentUserId = this.authService.getUserId();

  readonly dependencyForm = this.fb.nonNullable.group(
    {
      portfolioId: ['', [Validators.required]],
      projectId: ['', [Validators.required]],
      dependsOnProjectId: ['', [Validators.required]],
      reason: [''],
    },
    { validators: [dependencyProjectValidator] }
  );

  readonly formValues = toSignal(
    this.dependencyForm.valueChanges.pipe(startWith(this.dependencyForm.getRawValue())),
    { initialValue: this.dependencyForm.getRawValue() }
  );

  readonly selectedPortfolio = computed(() => {
    const portfolioId = this.formValues().portfolioId;
    return this.portfolios().find((portfolio) => portfolio.id === portfolioId) ?? null;
  });

  readonly totalDependencies = computed(() => this.dependencies().length);
  readonly totalProjects = computed(() => this.projects().length);

  constructor() {
    this.loadPortfolios();
    this.dependencyForm.controls.portfolioId.valueChanges.subscribe((portfolioId) => {
      this.onPortfolioChange(portfolioId);
    });
  }

  get controls() {
    return this.dependencyForm.controls;
  }

  get hasUserId(): boolean {
    return Boolean(this.currentUserId);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.feedback.set(null);

    if (this.dependencyForm.invalid) {
      this.dependencyForm.markAllAsTouched();
      return;
    }

    if (!this.currentUserId) {
      this.feedback.set({
        kind: 'error',
        text: 'Não foi possível identificar o usuário autenticado para criar a dependência.',
      });
      return;
    }

    const values = this.dependencyForm.getRawValue();
    const payload: CreateProjectDependencyDto = {
      reason: values.reason?.trim() ? values.reason.trim() : null,
      projectId: values.projectId,
      dependsOnProjectId: values.dependsOnProjectId,
      portfolioId: values.portfolioId,
      userId: this.currentUserId,
    };

    this.isSaving.set(true);
    this.projectDependencyService.createProjectDependency(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.feedback.set({
          kind: 'success',
          text: 'Dependência criada com sucesso.',
        });

        this.dependencyForm.patchValue(
          {
            projectId: '',
            dependsOnProjectId: '',
            reason: '',
          },
          { emitEvent: false }
        );

        const portfolioId = values.portfolioId;
        if (portfolioId) {
          this.loadDependencies(portfolioId);
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.feedback.set({
          kind: 'error',
          text: 'Não foi possível criar a dependência no momento.',
        });
      },
    });
  }

  deleteDependency(dependency: ProjectDependency): void {
    if (!dependency.id) {
      return;
    }

    this.deletingDependencyId.set(dependency.id);
    this.feedback.set(null);

    this.projectDependencyService.deleteProjectDependency(dependency.id).subscribe({
      next: () => {
        this.deletingDependencyId.set(null);
        this.feedback.set({
          kind: 'success',
          text: 'Dependência removida com sucesso.',
        });

        const portfolioId = this.dependencyForm.controls.portfolioId.value;
        if (portfolioId) {
          this.loadDependencies(portfolioId);
        }
      },
      error: () => {
        this.deletingDependencyId.set(null);
        this.feedback.set({
          kind: 'error',
          text: 'Não foi possível remover a dependência selecionada.',
        });
      },
    });
  }

  trackByDependencyId(index: number, dependency: ProjectDependency): string {
    return dependency.id ?? dependency.projectId ?? String(index);
  }

  trackByPortfolioId(index: number, portfolio: Portfolio): string {
    return portfolio.id ?? String(index);
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id ?? project.name ?? String(index);
  }

  getProjectLabel(project: Project): string {
    return project.name || 'Sem nome';
  }

  private loadPortfolios(): void {
    this.isLoadingPortfolios.set(true);

    this.portfoliosService.getPortfolios().subscribe({
      next: (portfolios) => {
        this.portfolios.set(portfolios);
        this.isLoadingPortfolios.set(false);
      },
      error: () => {
        this.portfolios.set([]);
        this.isLoadingPortfolios.set(false);
        this.feedback.set({
          kind: 'error',
          text: 'Não foi possível carregar os portfolios.',
        });
      },
    });
  }

  private onPortfolioChange(portfolioId: string): void {
    this.projects.set([]);
    this.dependencies.set([]);
    this.feedback.set(null);
    this.dependencyForm.patchValue(
      {
        projectId: '',
        dependsOnProjectId: '',
      },
      { emitEvent: false }
    );

    if (!portfolioId) {
      return;
    }

    this.loadProjects(portfolioId);
    this.loadDependencies(portfolioId);
  }

  private loadProjects(portfolioId: string): void {
    this.isLoadingProjects.set(true);

    this.projectService.getProjectsByPortfolio(portfolioId).subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoadingProjects.set(false);
      },
      error: () => {
        this.projects.set([]);
        this.isLoadingProjects.set(false);
        this.feedback.set({
          kind: 'error',
          text: 'Não foi possível carregar os projetos deste portfolio.',
        });
      },
    });
  }

  private loadDependencies(portfolioId: string): void {
    this.isLoadingDependencies.set(true);

    this.projectDependencyService.getProjectDependenciesByPortfolio(portfolioId).subscribe({
      next: (dependencies) => {
        this.dependencies.set(dependencies);
        this.isLoadingDependencies.set(false);
      },
      error: () => {
        this.dependencies.set([]);
        this.isLoadingDependencies.set(false);
        this.feedback.set({
          kind: 'error',
          text: 'Não foi possível carregar as dependências deste portfolio.',
        });
      },
    });
  }
}
