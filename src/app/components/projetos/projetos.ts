import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Project, ProjectService } from '../../services/projectService';

@Component({
  selector: 'app-projetos',
  imports: [],
  templateUrl: './projetos.html',
  styleUrl: './projetos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projetos {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<Project[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  readonly totalProjects = computed(() => this.projects().length);

  constructor() {
    this.loadProjects();
  }

  navigateToCreateProject() {
    void this.router.navigate(['/projetos/novo']);
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: () => {
        this.projects.set([]);
        this.loadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id ?? project.name ?? String(index);
  }
}
