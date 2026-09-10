import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { Project, ProjectService } from '../../services/projectService';
import { Team, TeamsService } from '../../services/teamsService';

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
  private readonly teamsService = inject(TeamsService);
  private readonly authService = inject(AuthService);

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

  navigateToProject(projectId?: string) {
    if (!projectId) return;
    void this.router.navigate(['/projetos', projectId]);
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    forkJoin({
      projects: this.projectService.getProjects(),
      teams: this.teamsService.getTeams(),
    }).subscribe({
      next: ({ projects, teams }) => {
        this.projects.set(this.filterProjectsByOwnTeams(projects, teams));
        this.isLoading.set(false);
      },
      error: () => {
        this.projects.set([]);
        this.loadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Mantém apenas os projetos cujo portfolio está associado a algum time do
   * qual o usuário autenticado participa (como dono ou membro).
   *
   * ⚠️ Filtro feito só no front-end: `GET /Projects` continua retornando
   * todos os projetos para qualquer usuário autenticado. Para restrição real,
   * o backend precisa filtrar `GET /Projects` (e `GET /Projects/{id}`) pelos
   * times do usuário autenticado via JWT.
   */
  private filterProjectsByOwnTeams(projects: Project[], teams: Team[]): Project[] {
    const userId = this.authService.getUserId();
    if (!userId) return projects;

    const ownPortfolioIds = new Set(
      teams
        .filter((team) => team.ownerUserId === userId || team.members.some((m) => m.userId === userId))
        .map((team) => team.portfolioId)
    );

    return projects.filter((project) => !!project.portfolioId && ownPortfolioIds.has(project.portfolioId));
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id ?? project.name ?? String(index);
  }
}
