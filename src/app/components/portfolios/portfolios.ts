import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

import {
	CreatePortfolioDto,
	Portfolio,
	PortfoliosService,
} from '../../services/portfoliosService';
import {
	CreatePriorityCriteriaDto,
	PriorityCriteria,
	PriorityCriteriaService,
} from '../../services/priorityCriteriaService';

@Component({
	selector: 'app-portfolios',
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './portfolios.html',
	styleUrl: './portfolios.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolios {
	private readonly portfoliosService = inject(PortfoliosService);
	private readonly priorityCriteriaService = inject(PriorityCriteriaService);
	private readonly fb = inject(FormBuilder);

	readonly loading = signal(false);
	readonly error = signal<string | null>(null);
	readonly portfolios = signal<Portfolio[]>([]);
	readonly selectedPortfolioId = signal<string | null>(null);
	readonly priorityCriteria = signal<PriorityCriteria[]>([]);

	readonly editedWeights = signal<Record<string, number>>({});

	readonly hasWeightChanges = computed(() => {
		const edits = this.editedWeights();
		if (Object.keys(edits).length === 0) return false;
		for (const id of Object.keys(edits)) {
			const orig = this.priorityCriteria().find((c) => c.id === id);
			if (!orig) return true;
			if (this.roundTwo(orig.valueWeight) !== this.roundTwo(edits[id])) return true;
		}
		return false;
	});

	readonly editedTotalWeight = computed(() => {
		const map = this.editedWeights();
		return this.priorityCriteria().reduce((sum, c) => sum + (map[c.id] ?? c.valueWeight ?? 0), 0);
	});

	readonly canSaveWeights = computed(() => {
		if (!this.hasWeightChanges()) return false;
		const diff = Math.abs(this.editedTotalWeight() - 100);
		return diff < 1e-6;
	});
	readonly createSubmitted = signal(false);
	readonly createCriteriaSubmitted = signal(false);
	readonly ownerFilterSubmitted = signal(false);
	readonly showPortfolioForm = signal(false);
	readonly showPriorityCriteriaForm = signal(false);
	readonly selectedPortfolio = computed(
		() => this.portfolios().find((portfolio) => portfolio.id === this.selectedPortfolioId()) ?? null
	);
	readonly selectedPortfolioName = computed(() => this.selectedPortfolio()?.name ?? 'Portfolio selecionado');

	readonly portfolioForm = this.fb.nonNullable.group({
		name: ['', [Validators.required, Validators.minLength(3)]],
		description: ['', [Validators.required, Validators.minLength(5)]],
	});

	readonly priorityCriteriaForm = this.fb.nonNullable.group({
		name: ['', [Validators.required, Validators.minLength(3)]],
	});


	readonly totalCriteriaWeight = computed(() =>
		this.priorityCriteria().reduce((sum, criteria) => sum + (criteria.valueWeight ?? 0), 0)
	);

	readonly remainingWeight = computed(() => 100 - this.totalCriteriaWeight());

	readonly canCreateWithoutExceed = computed(() => true);

	private roundTwo = (v: number) => Math.round(v * 100) / 100;

	formatDate(iso?: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		const day = pad(d.getDate());
		const month = pad(d.getMonth() + 1);
		const year = d.getFullYear();
		const hours = pad(d.getHours());
		const minutes = pad(d.getMinutes());
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	readonly priorityCriteriaError = signal<string | null>(null);

	constructor() {
		effect(() => {
			if (!this.selectedPortfolioId() && this.portfolios().length > 0) {
				this.selectPortfolio(this.portfolios()[0].id);
			}
		});

		void this.loadPortfolios();
	}

	deleteCriteria(id: string): void {
		// kept for backward compatibility; use requestDeleteCriteria to show modal
		this.requestDeleteCriteria(id);
	}

	readonly pendingDeleteId = signal<string | null>(null);
	readonly pendingDeleteName = signal<string | null>(null);

	requestDeleteCriteria(id: string): void {
		const crit = this.priorityCriteria().find((c) => c.id === id);
		this.pendingDeleteId.set(id);
		this.pendingDeleteName.set(crit?.name ?? null);
	}

	cancelDelete(): void {
		this.pendingDeleteId.set(null);
		this.pendingDeleteName.set(null);
	}

	confirmDelete(): void {
		const id = this.pendingDeleteId();
		if (!id) return;

		this.priorityCriteriaService.deletePriorityCriteria(id).subscribe({
			next: () => {
				this.priorityCriteria.update((list) => list.filter((c) => c.id !== id));
				this.editedWeights.update((m) => {
					const copy = { ...m };
					delete copy[id];
					return copy;
				});
				this.cancelDelete();
			},
			error: () => {
				this.error.set('Falha ao excluir o critério de prioridade.');
				this.cancelDelete();
			},
		});
	}

    

	onWeightInput(id: string, raw: string | number): void {
		const value = Number(raw);
		if (Number.isNaN(value)) return;
		this.editedWeights.update((m) => ({ ...m, [id]: this.roundTwo(value) }));
		this.priorityCriteriaError.set(null);
	}

	getEditedWeight(id: string): number {
		const map = this.editedWeights();
		if (map[id] !== undefined) return map[id];
		return this.priorityCriteria().find((c) => c.id === id)?.valueWeight ?? 0;
	}

	saveWeightChanges(): void {
		if (!this.hasWeightChanges()) return;

		if (!this.canSaveWeights()) {
			this.priorityCriteriaError.set('A soma dos pesos deve ser igual a 100%.');
			return;
		}
		const edits = this.editedWeights();
		const updates = Object.keys(edits).map((id) => {
			const newVal = edits[id];
			const orig = this.priorityCriteria().find((c) => c.id === id);
			if (!orig) return null;
			if (this.roundTwo(orig.valueWeight) === this.roundTwo(newVal)) return null;
			return this.priorityCriteriaService.updatePriorityCriteria(id, {
				id,
				name: orig.name,
				valueWeight: newVal,
			});
		}).filter((u) => u !== null) as import('rxjs').Observable<any>[];

		if (updates.length === 0) return;

		const batch$ = (forkJoin(updates) as Observable<any>);
		batch$.subscribe({
			next: () => {
				const selected = this.selectedPortfolioId();
				if (selected) this.loadPriorityCriteria(selected);
				this.editedWeights.set({});
			},
			error: () => this.error.set('Falha ao salvar alterações de pesos.'),
		});
	}

	get portfolioControls() {
		return this.portfolioForm.controls;
	}


	get priorityCriteriaControls() {
		return this.priorityCriteriaForm.controls;
	}

	togglePortfolioForm(): void {
		this.showPortfolioForm.update((show) => !show);
	}

	togglePriorityCriteriaForm(): void {
		this.showPriorityCriteriaForm.update((show) => !show);
	}

	async loadPortfolios(): Promise<void> {
		this.loading.set(true);
		this.error.set(null);

		this.portfoliosService.getPortfolios().subscribe({
			next: (portfolios) => {
				this.portfolios.set(portfolios);
				if (portfolios.length > 0 && !this.selectedPortfolioId()) {
					this.selectPortfolio(portfolios[0].id);
				}
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Não foi possível carregar os portfolios.');
				this.loading.set(false);
			},
		});
	}

	selectPortfolio(portfolioId: string): void {
		this.selectedPortfolioId.set(portfolioId);
		this.loadPriorityCriteria(portfolioId);
	}

	loadPriorityCriteria(portfolioId: string): void {
		this.priorityCriteriaService.getPriorityCriteriaByPortfolio(portfolioId).subscribe({
			next: (criteria) => this.priorityCriteria.set(criteria),
			error: () => this.priorityCriteria.set([]),
		});
	}

	onSubmitPriorityCriteria(): void {
		this.createCriteriaSubmitted.set(true);
		const selectedPortfolioId = this.selectedPortfolioId();

		if (!selectedPortfolioId) {
			this.error.set('Selecione um portfolio para criar um critério de prioridade.');
			return;
		}


		if (this.priorityCriteriaForm.invalid) {
			this.priorityCriteriaForm.markAllAsTouched();
			return;
		}

		const formValue = this.priorityCriteriaForm.getRawValue();
		const newWeight = 0; // creation always sets weight to 0
		const totalAfter = this.totalCriteriaWeight() + newWeight;

		if (totalAfter > 100 + 1e-9) {
			this.priorityCriteriaError.set('A soma dos pesos excede 100. Ajuste os pesos existentes antes de criar.');
			return;
		}

		this.priorityCriteriaError.set(null);

		const payload = {
			...formValue,
			portfolioId: selectedPortfolioId,
			valueWeight: 0,
		} satisfies CreatePriorityCriteriaDto;

		this.priorityCriteriaService.createPriorityCriteria(payload).subscribe({
			next: (criteria) => {
				this.priorityCriteria.update((currentCriteria) => [criteria, ...currentCriteria]);
				this.priorityCriteriaForm.reset({ name: ''});
				this.createCriteriaSubmitted.set(false);
				this.showPriorityCriteriaForm.set(false);
			},
			error: () => {
				this.error.set('Não foi possível criar o critério de prioridade.');
			},
		});
	}

	onSubmitPortfolio(): void {
		this.createSubmitted.set(true);

		if (this.portfolioForm.invalid) {
			this.portfolioForm.markAllAsTouched();
			return;
		}

		const payload = this.portfolioForm.getRawValue() satisfies CreatePortfolioDto;

		this.portfoliosService.createPortfolio(payload).subscribe({
			next: (portfolio) => {
				this.portfolios.update((portfolios) => [portfolio, ...portfolios]);
				this.portfolioForm.reset({ name: '', description: '',  });
				this.createSubmitted.set(false);
				this.showPortfolioForm.set(false);
				this.selectPortfolio(portfolio.id);
			},
		});
	}



	clearPriorityCriteriaForm(): void {
		this.priorityCriteriaForm.reset({ name: ''});
		this.createCriteriaSubmitted.set(false);
		this.showPriorityCriteriaForm.set(false);
	}
}