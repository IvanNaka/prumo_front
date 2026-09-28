import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Team } from '../../../services/teamsService';
import {
	CreateTeamCapacityDto,
	TeamCapacityEntry,
	TeamCapacityService,
} from '../../../services/teamCapacityService';

const MONTH_NAMES = [
	'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
	'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
	selector: 'app-capacidade-equipe',
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './capacidade-equipe.html',
	styleUrl: './capacidade-equipe.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacidadeEquipe {
	private readonly fb = inject(FormBuilder);
	private readonly teamCapacityService = inject(TeamCapacityService);

	readonly team = input.required<Team>();

	readonly isLoading = signal(false);
	readonly entries = signal<TeamCapacityEntry[]>([]);
	readonly isSaving = signal(false);
	readonly submitted = signal(false);
	readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

	readonly today = new Date();

	readonly selectedYear = signal(this.today.getFullYear());
	readonly selectedMonth = signal(this.today.getMonth() + 1);

	readonly years = computed(() => {
		const current = this.today.getFullYear();
		return [current - 1, current, current + 1];
	});

	readonly months = MONTH_NAMES.map((label, index) => ({ value: index + 1, label }));

	/** Cenário 1: Visualização de capacidade — entradas do mês/ano selecionado. */
	readonly entriesForPeriod = computed(() =>
		this.entries().filter((e) => e.year === this.selectedYear() && e.month === this.selectedMonth())
	);

	readonly teamAverageOccupancy = computed(() => {
		const list = this.entriesForPeriod();
		if (list.length === 0) return 0;
		const sum = list.reduce((acc, e) => acc + this.occupancy(e), 0);
		return Math.round(sum / list.length);
	});

	readonly capacityForm = this.fb.nonNullable.group({
		userId: ['', [Validators.required]],
		year: [this.today.getFullYear(), [Validators.required]],
		month: [this.today.getMonth() + 1, [Validators.required]],
		availableHours: [160, [Validators.required, Validators.min(1)]],
	});

	get capacityControls() {
		return this.capacityForm.controls;
	}

	constructor() {
		effect(() => {
			const team = this.team();
			if (team) {
				this.loadCapacity(team.id);
			}
		});
	}

	selectPeriod(year: number, month: number): void {
		this.selectedYear.set(year);
		this.selectedMonth.set(month);
	}

	occupancy(entry: TeamCapacityEntry): number {
		if (entry.occupancyPercent != null) return Math.round(entry.occupancyPercent);
		if (!entry.availableHours) return 0;
		return Math.round((entry.allocatedHours / entry.availableHours) * 100);
	}

	occupancyClass(entry: TeamCapacityEntry): string {
		const percent = this.occupancy(entry);
		if (percent > 100) return 'occupancy-over';
		if (percent >= 80) return 'occupancy-high';
		return 'occupancy-normal';
	}

	monthLabel(month: number): string {
		return MONTH_NAMES[month - 1] ?? '';
	}

	onSubmit(): void {
		this.submitted.set(true);
		this.feedback.set(null);

		const team = this.team();
		if (!team || this.capacityForm.invalid) {
			this.capacityForm.markAllAsTouched();
			return;
		}

		const values = this.capacityForm.getRawValue();
		const payload: CreateTeamCapacityDto = {
			teamId: team.id,
			userId: values.userId,
			year: values.year,
			month: values.month,
			availableHours: values.availableHours,
		};

		this.isSaving.set(true);
		this.teamCapacityService.registerCapacity(payload).subscribe({
			next: (entry) => {
				this.entries.update((current) => {
					const withoutExisting = current.filter(
						(e) => !(e.userId === entry.userId && e.year === entry.year && e.month === entry.month)
					);
					return [...withoutExisting, entry];
				});
				this.isSaving.set(false);
				this.submitted.set(false);
				this.selectPeriod(entry.year, entry.month);
				this.feedback.set({ kind: 'success', text: 'Capacidade mensal registrada com sucesso.' });
				this.capacityForm.patchValue({ availableHours: 160 });
			},
			error: () => {
				this.isSaving.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível registrar a capacidade mensal.' });
			},
		});
	}

	trackByEntryId(index: number, entry: TeamCapacityEntry): string {
		return entry.id ?? String(index);
	}

	private loadCapacity(teamId: string): void {
		this.isLoading.set(true);

		this.teamCapacityService.getCapacityByTeam(teamId).subscribe({
			next: (entries) => {
				this.entries.set(entries);
				this.isLoading.set(false);
			},
			error: () => {
				this.entries.set([]);
				this.isLoading.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível carregar a capacidade da equipe.' });
			},
		});
	}
}
