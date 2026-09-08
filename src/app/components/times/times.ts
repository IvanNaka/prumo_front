import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { Portfolio, PortfoliosService } from '../../services/portfoliosService';
import { TeamAccessService } from '../../services/team-access.service';
import { User, UsersService } from '../../services/usersService';
import {
	AddTeamMemberDto,
	CreateTeamDto,
	Team,
	TeamsService,
} from '../../services/teamsService';

@Component({
	selector: 'app-times',
	imports: [ReactiveFormsModule],
	templateUrl: './times.html',
	styleUrl: './times.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Times {
	private readonly fb = inject(FormBuilder);
	private readonly authService = inject(AuthService);
	private readonly portfoliosService = inject(PortfoliosService);
	private readonly usersService = inject(UsersService);
	private readonly teamsService = inject(TeamsService);
	private readonly teamAccessService = inject(TeamAccessService);

	private readonly currentUserId = this.authService.getUserId();

	readonly isLoadingPortfolios = signal(false);
	readonly isLoadingUsers = signal(false);
	readonly isLoadingTeams = signal(true);
	readonly isSaving = signal(false);
	readonly isSavingMember = signal(false);
	readonly isJoiningByCode = signal(false);
	readonly deletingTeamId = signal<string | null>(null);
	readonly removingMemberId = signal<string | null>(null);

	readonly portfolios = signal<Portfolio[]>([]);
	readonly users = signal<User[]>([]);
	/** Todos os times, de todos os portfólios — fonte única de verdade da tela. */
	readonly allTeams = signal<Team[]>([]);
	readonly selectedPortfolioId = signal<string | null>(null);
	readonly selectedTeamId = signal<string | null>(null);
	readonly showTeamForm = signal(false);
	readonly createSubmitted = signal(false);
	readonly addMemberSubmitted = signal(false);
	readonly joinSubmitted = signal(false);
	readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

	readonly pendingDeleteTeamId = signal<string | null>(null);
	readonly pendingDeleteTeamName = signal<string | null>(null);

	/** Times dos quais o usuário logado participa (dono ou membro). */
	readonly myTeams = computed(() => {
		const userId = this.currentUserId;
		if (!userId) return [];
		return this.allTeams().filter(
			(team) => team.ownerUserId === userId || team.members.some((m) => m.userId === userId)
		);
	});

	/**
	 * Enquanto o usuário não pertencer a nenhum time, a tela só mostra a opção
	 * de entrar com código ou criar um novo time. Se não for possível
	 * identificar o usuário (token sem claim), não restringimos a tela.
	 */
	readonly hasNoTeam = computed(
		() => !this.isLoadingTeams() && !!this.currentUserId && this.myTeams().length === 0
	);

	readonly portfolioTeams = computed(() => {
		const portfolioId = this.selectedPortfolioId();
		if (!portfolioId) return [];
		return this.allTeams().filter((team) => team.portfolioId === portfolioId);
	});

	readonly teamForm = this.fb.nonNullable.group({
		portfolioId: ['', [Validators.required]],
		name: ['', [Validators.required, Validators.minLength(3)]],
		ownerUserId: [''],
	});

	readonly addMemberForm = this.fb.nonNullable.group({
		userId: ['', [Validators.required]],
	});

	readonly joinForm = this.fb.nonNullable.group({
		code: ['', [Validators.required, Validators.minLength(4)]],
	});

	readonly selectedTeam = computed(
		() => this.allTeams().find((team) => team.id === this.selectedTeamId()) ?? null
	);

	readonly availableUsersForMember = computed(() => {
		const team = this.selectedTeam();
		if (!team) return this.users();
		const memberIds = new Set(team.members.map((m) => m.userId));
		return this.users().filter((u) => !memberIds.has(u.id));
	});

	get teamControls() {
		return this.teamForm.controls;
	}

	get addMemberControls() {
		return this.addMemberForm.controls;
	}

	get joinControls() {
		return this.joinForm.controls;
	}

	constructor() {
		this.loadPortfolios();
		this.loadUsers();
		this.loadAllTeams();
	}

	selectPortfolio(portfolioId: string): void {
		if (this.selectedPortfolioId() === portfolioId) return;
		this.selectedPortfolioId.set(portfolioId);
		this.selectedTeamId.set(null);
		this.feedback.set(null);
	}

	selectTeam(teamId: string): void {
		this.selectedTeamId.set(teamId);
		this.addMemberForm.reset({ userId: '' });
	}

	openTeamForm(): void {
		this.showTeamForm.set(true);
		this.createSubmitted.set(false);
		this.teamForm.reset({
			portfolioId: this.selectedPortfolioId() ?? this.portfolios()[0]?.id ?? '',
			name: '',
			ownerUserId: this.currentUserId ?? '',
		});
	}

	closeTeamForm(): void {
		this.showTeamForm.set(false);
		this.createSubmitted.set(false);
	}

	onSubmitTeam(): void {
		this.createSubmitted.set(true);
		this.feedback.set(null);

		if (this.teamForm.invalid) {
			this.teamForm.markAllAsTouched();
			return;
		}

		const values = this.teamForm.getRawValue();
		const payload: CreateTeamDto = {
			portfolioId: values.portfolioId,
			name: values.name,
			ownerUserId: values.ownerUserId ? values.ownerUserId : null,
		};

		this.isSaving.set(true);
		this.teamsService.createTeam(payload).subscribe({
			next: (team) => {
				this.isSaving.set(false);
				this.allTeams.update((current) => [team, ...current]);
				this.closeTeamForm();
				this.selectedPortfolioId.set(team.portfolioId);
				this.selectTeam(team.id);
				this.teamAccessService.markHasTeam();
				this.feedback.set({ kind: 'success', text: 'Time criado com sucesso.' });
			},
			error: () => {
				this.isSaving.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível criar o time.' });
			},
		});
	}

	onSubmitJoin(): void {
		this.joinSubmitted.set(true);
		this.feedback.set(null);

		if (this.joinForm.invalid) {
			this.joinForm.markAllAsTouched();
			return;
		}

		const code = this.joinForm.getRawValue().code.trim();

		this.isJoiningByCode.set(true);
		this.teamsService.joinTeamByCode(code).subscribe({
			next: (team) => {
				this.isJoiningByCode.set(false);
				this.allTeams.update((current) => {
					const exists = current.some((t) => t.id === team.id);
					return exists ? current.map((t) => (t.id === team.id ? team : t)) : [team, ...current];
				});
				this.joinForm.reset({ code: '' });
				this.joinSubmitted.set(false);
				this.selectedPortfolioId.set(team.portfolioId);
				this.selectTeam(team.id);
				this.teamAccessService.markHasTeam();
				this.feedback.set({ kind: 'success', text: `Você entrou no time "${team.name ?? ''}".` });
			},
			error: (error: HttpErrorResponse) => {
				this.isJoiningByCode.set(false);
				this.feedback.set({ kind: 'error', text: this.mapJoinError(error) });
			},
		});
	}

	requestDeleteTeam(team: Team): void {
		this.pendingDeleteTeamId.set(team.id);
		this.pendingDeleteTeamName.set(team.name ?? null);
	}

	cancelDeleteTeam(): void {
		this.pendingDeleteTeamId.set(null);
		this.pendingDeleteTeamName.set(null);
	}

	confirmDeleteTeam(): void {
		const id = this.pendingDeleteTeamId();
		if (!id) return;

		this.deletingTeamId.set(id);
		this.teamsService.deleteTeam(id).subscribe({
			next: () => {
				this.deletingTeamId.set(null);
				this.allTeams.update((current) => current.filter((t) => t.id !== id));
				if (this.selectedTeamId() === id) this.selectedTeamId.set(null);
				this.cancelDeleteTeam();
				this.feedback.set({ kind: 'success', text: 'Time removido com sucesso.' });
			},
			error: () => {
				this.deletingTeamId.set(null);
				this.feedback.set({ kind: 'error', text: 'Não foi possível remover o time.' });
				this.cancelDeleteTeam();
			},
		});
	}

	onSubmitAddMember(): void {
		this.addMemberSubmitted.set(true);
		this.feedback.set(null);

		const team = this.selectedTeam();
		if (!team) return;

		if (this.addMemberForm.invalid) {
			this.addMemberForm.markAllAsTouched();
			return;
		}

		const payload: AddTeamMemberDto = this.addMemberForm.getRawValue();

		this.isSavingMember.set(true);
		this.teamsService.addMember(team.id, payload).subscribe({
			next: (updatedTeam) => {
				this.isSavingMember.set(false);
				this.allTeams.update((current) => current.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
				this.addMemberForm.reset({ userId: '' });
				this.addMemberSubmitted.set(false);
				this.feedback.set({ kind: 'success', text: 'Pessoa adicionada ao time.' });
			},
			error: () => {
				this.isSavingMember.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível adicionar essa pessoa ao time.' });
			},
		});
	}

	removeMember(userId: string): void {
		const team = this.selectedTeam();
		if (!team) return;

		this.removingMemberId.set(userId);
		this.teamsService.removeMember(team.id, userId).subscribe({
			next: (updatedTeam) => {
				this.removingMemberId.set(null);
				this.allTeams.update((current) => current.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
				this.feedback.set({ kind: 'success', text: 'Pessoa removida do time.' });
			},
			error: () => {
				this.removingMemberId.set(null);
				this.feedback.set({ kind: 'error', text: 'Não foi possível remover essa pessoa do time.' });
			},
		});
	}

	trackByPortfolioId(index: number, portfolio: Portfolio): string {
		return portfolio.id ?? String(index);
	}

	trackByTeamId(index: number, team: Team): string {
		return team.id ?? String(index);
	}

	trackByUserId(index: number, user: User): string {
		return user.id ?? String(index);
	}

	trackByMemberId(index: number, member: { userId: string }): string {
		return member.userId ?? String(index);
	}

	formatDate(iso?: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
				this.feedback.set({ kind: 'error', text: 'Não foi possível carregar os portfólios.' });
			},
		});
	}

	private loadUsers(): void {
		this.isLoadingUsers.set(true);

		this.usersService.getUsers().subscribe({
			next: (users) => {
				this.users.set(users);
				this.isLoadingUsers.set(false);
			},
			error: () => {
				this.users.set([]);
				this.isLoadingUsers.set(false);
			},
		});
	}

	private loadAllTeams(): void {
		this.isLoadingTeams.set(true);

		this.teamsService.getTeams().subscribe({
			next: (teams) => {
				this.allTeams.set(teams);
				this.isLoadingTeams.set(false);

				const userId = this.currentUserId;
				const firstOwnTeam = userId
					? teams.find((t) => t.ownerUserId === userId || t.members.some((m) => m.userId === userId))
					: undefined;

				this.teamAccessService.setHasTeam(!userId || !!firstOwnTeam);

				if (firstOwnTeam) {
					this.selectedPortfolioId.set(firstOwnTeam.portfolioId);
				} else if (teams.length > 0) {
					this.selectedPortfolioId.set(teams[0].portfolioId);
				}
			},
			error: () => {
				this.allTeams.set([]);
				this.isLoadingTeams.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível carregar os times.' });
			},
		});
	}

	private mapJoinError(error: HttpErrorResponse): string {
		if (error.status === 404) {
			return 'Código de time inválido. Confira com quem te convidou e tente novamente.';
		}

		if (error.status === 409) {
			return 'Você já é membro deste time.';
		}

		if (error.status === 400) {
			return 'Não foi possível processar esse código. Verifique e tente novamente.';
		}

		return 'Não foi possível entrar no time com esse código no momento.';
	}
}

