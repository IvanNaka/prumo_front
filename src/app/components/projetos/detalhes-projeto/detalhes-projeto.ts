
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Project, ProjectService } from '../../../services/projectService';

@Component({
  selector: 'app-detalhes-projeto',
  imports: [],
  templateUrl: './detalhes-projeto.html',
  styleUrl: './detalhes-projeto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalhesProjeto {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);
  readonly evaluations = computed(() => this.project()?.projectEvaluations ?? []);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loadError.set(true);
        this.isLoading.set(false);
        return;
      }

      this.loadProject(id);
    });
  }

  private loadProject(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    this.projectService.getProjectById(id).subscribe({
      next: (proj) => {
        this.project.set(proj);
        this.isLoading.set(false);
      },
      error: () => {
        this.project.set(null);
        this.loadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  navigateBack(): void {
    void this.router.navigate(['/projetos']);
  }
}
