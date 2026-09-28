import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Portfolio, PortfoliosService } from '../../services/portfoliosService';
import { Project, ProjectService } from '../../services/projectService';
import {
	CreateRoadmapItemDto,
	RoadmapItem,
	RoadmapItemStatus,
	RoadmapService,
	UpdateRoadmapItemDto,
} from '../../services/roadmapService';

interface RoadmapTimelineItem extends RoadmapItem {
	offsetPercent: number;
	widthPercent: number;
}

const MONTH_MS = 1000 * 60 * 60 * 24 * 30;

@Component({
	selector: 'app-roadmap',
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './roadmap.html',
	styleUrl: './roadmap.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Roadmap {
	private readonly fb = inject(FormBuilder);
	private readonly portfoliosService = inject(PortfoliosService);
	private readonly projectService = inject(ProjectService);
	private readonly roadmapService = inject(RoadmapService);

	readonly statusOptions = [
		{ value: RoadmapItemStatus.Planejado, label: 'Planejado' },
		{ value: RoadmapItemStatus.EmAndamento, label: 'Em andamento' },
		{ value: RoadmapItemStatus.Concluido, label: 'Concluído' },
		{ value: RoadmapItemStatus.Atrasado, label: 'Atrasado' },
	];

	readonly isLoadingPortfolios = signal(true);
	readonly isLoadingItems = signal(false);
	readonly portfolios = signal<Portfolio[]>([]);
	readonly projects = signal<Project[]>([]);
	readonly items = signal<RoadmapItem[]>([]);
	readonly selectedPortfolioId = signal<string | null>(null);

	readonly activeTab = signal<'visualizacao' | 'estrutura'>('visualizacao');

	readonly showItemForm = signal(false);
	readonly editingItemId = signal<string | null>(null);
	readonly itemSubmitted = signal(false);
	readonly isSavingItem = signal(false);
	readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

	readonly pendingDeleteId = signal<string | null>(null);
	readonly pendingDeleteTitle = signal<string | null>(null);

	readonly selectedPortfolio = computed(
		() => this.portfolios().find((p) => p.id === this.selectedPortfolioId()) ?? null
	);

	/** Itens ordenados pelo campo estrutural `order` (Cenário 2). */
	readonly orderedItems = computed(() => [...this.items()].sort((a, b) => a.order - b.order));

	/** Itens ordenados por data para a visualização em linha do tempo (Cenário 1). */
	readonly timelineItems = computed<RoadmapTimelineItem[]>(() => {
		const list = this.items();
		if (list.length === 0) return [];

		const starts = list.map((i) => new Date(i.startDate).getTime()).filter((t) => !Number.isNaN(t));
		const ends = list.map((i) => new Date(i.endDate).getTime()).filter((t) => !Number.isNaN(t));
		if (starts.length === 0 || ends.length === 0) return [];

		const minStart = Math.min(...starts);
		const maxEnd = Math.max(...ends);
		const totalSpan = Math.max(maxEnd - minStart, MONTH_MS);

		return [...list]
			.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
			.map((item) => {
				const start = new Date(item.startDate).getTime();
				const end = new Date(item.endDate).getTime();
				const offsetPercent = ((start - minStart) / totalSpan) * 100;
				const widthPercent = Math.max(((end - start) / totalSpan) * 100, 2);
				return { ...item, offsetPercent, widthPercent };
			});
	});

	readonly timelineStart = computed(() => this.formatMonthLabel(this.earliestDate()));
	readonly timelineEnd = computed(() => this.formatMonthLabel(this.latestDate()));

	readonly itemForm = this.fb.nonNullable.group({
		title: ['', [Validators.required, Validators.minLength(3)]],
		description: [''],
		projectId: [''],
		startDate: ['', [Validators.required]],
		endDate: ['', [Validators.required]],
		status: [RoadmapItemStatus.Planejado, [Validators.required]],
	});

	get itemControls() {
		return this.itemForm.controls;
	}

	constructor() {
		effect(() => {
			if (!this.selectedPortfolioId() && this.portfolios().length > 0) {
				this.selectPortfolio(this.portfolios()[0].id);
			}
		});

		this.loadPortfolios();
	}

	setTab(tab: 'visualizacao' | 'estrutura'): void {
		this.activeTab.set(tab);
	}

	selectPortfolio(portfolioId: string): void {
		this.selectedPortfolioId.set(portfolioId);
		this.loadRoadmapItems(portfolioId);
		this.loadProjects(portfolioId);
	}

	statusLabel(status: RoadmapItemStatus): string {
		return this.statusOptions.find((s) => s.value === status)?.label ?? 'Planejado';
	}

	statusClass(status: RoadmapItemStatus): string {
		switch (status) {
			case RoadmapItemStatus.Concluido:
				return 'status-concluido';
			case RoadmapItemStatus.EmAndamento:
				return 'status-andamento';
			case RoadmapItemStatus.Atrasado:
				return 'status-atrasado';
			default:
				return 'status-planejado';
		}
	}

	formatDate(iso?: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
	}

	openCreateForm(): void {
		this.editingItemId.set(null);
		this.itemSubmitted.set(false);
		this.itemForm.reset({
			title: '',
			description: '',
			projectId: '',
			startDate: '',
			endDate: '',
			status: RoadmapItemStatus.Planejado,
		});
		this.showItemForm.set(true);
	}

	openEditForm(item: RoadmapItem): void {
		this.editingItemId.set(item.id);
		this.itemSubmitted.set(false);
		this.itemForm.reset({
			title: item.title,
			description: item.description ?? '',
			projectId: item.projectId ?? '',
			startDate: item.startDate?.slice(0, 10) ?? '',
			endDate: item.endDate?.slice(0, 10) ?? '',
			status: item.status,
		});
		this.showItemForm.set(true);
	}

	closeItemForm(): void {
		this.showItemForm.set(false);
		this.itemSubmitted.set(false);
	}

	onSubmitItem(): void {
		this.itemSubmitted.set(true);
		this.feedback.set(null);

		const portfolioId = this.selectedPortfolioId();
		if (!portfolioId) return;

		if (this.itemForm.invalid) {
			this.itemForm.markAllAsTouched();
			return;
		}

		const values = this.itemForm.getRawValue();
		if (new Date(values.endDate) < new Date(values.startDate)) {
			this.feedback.set({ kind: 'error', text: 'A data de término deve ser posterior à data de início.' });
			return;
		}

		this.isSavingItem.set(true);
		const editingId = this.editingItemId();

		if (editingId) {
			const existing = this.items().find((i) => i.id === editingId);
			const payload: UpdateRoadmapItemDto = {
				id: editingId,
				projectId: values.projectId || null,
				title: values.title,
				description: values.description || null,
				startDate: values.startDate,
				endDate: values.endDate,
				status: values.status,
				order: existing?.order ?? 0,
			};

			this.roadmapService.updateRoadmapItem(editingId, payload).subscribe({
				next: () => {
					this.items.update((current) =>
						current.map((i) => (i.id === editingId ? { ...i, ...payload, projectId: payload.projectId } : i))
					);
					this.isSavingItem.set(false);
					this.closeItemForm();
					this.feedback.set({ kind: 'success', text: 'Item do roadmap atualizado com sucesso.' });
				},
				error: () => {
					this.isSavingItem.set(false);
					this.feedback.set({ kind: 'error', text: 'Não foi possível atualizar o item do roadmap.' });
				},
			});
			return;
		}

		const payload: CreateRoadmapItemDto = {
			portfolioId,
			projectId: values.projectId || null,
			title: values.title,
			description: values.description || null,
			startDate: values.startDate,
			endDate: values.endDate,
			status: values.status,
		};

		this.roadmapService.createRoadmapItem(payload).subscribe({
			next: (created) => {
				this.items.update((current) => [...current, created]);
				this.isSavingItem.set(false);
				this.closeItemForm();
				this.feedback.set({ kind: 'success', text: 'Item adicionado ao roadmap com sucesso.' });
			},
			error: () => {
				this.isSavingItem.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível criar o item do roadmap.' });
			},
		});
	}

	requestDelete(item: RoadmapItem): void {
		this.pendingDeleteId.set(item.id);
		this.pendingDeleteTitle.set(item.title);
	}

	cancelDelete(): void {
		this.pendingDeleteId.set(null);
		this.pendingDeleteTitle.set(null);
	}

	confirmDelete(): void {
		const id = this.pendingDeleteId();
		if (!id) return;

		this.roadmapService.deleteRoadmapItem(id).subscribe({
			next: () => {
				this.items.update((current) => current.filter((i) => i.id !== id));
				this.cancelDelete();
				this.feedback.set({ kind: 'success', text: 'Item removido do roadmap.' });
			},
			error: () => {
				this.feedback.set({ kind: 'error', text: 'Não foi possível remover o item do roadmap.' });
				this.cancelDelete();
			},
		});
	}

	moveItem(item: RoadmapItem, direction: 'up' | 'down'): void {
		const ordered = this.orderedItems();
		const index = ordered.findIndex((i) => i.id === item.id);
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

		const reordered = [...ordered];
		[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
		const orderedIds = reordered.map((i) => i.id);

		const portfolioId = this.selectedPortfolioId();
		if (!portfolioId) return;

		const previousItems = this.items();
		this.items.set(previousItems.map((i) => {
			const newOrder = orderedIds.indexOf(i.id);
			return newOrder >= 0 ? { ...i, order: newOrder } : i;
		}));

		this.roadmapService.reorderRoadmapItems(portfolioId, orderedIds).subscribe({
			error: () => {
				this.items.set(previousItems);
				this.feedback.set({ kind: 'error', text: 'Não foi possível reordenar os itens do roadmap.' });
			},
		});
	}

	trackByPortfolioId(index: number, portfolio: Portfolio): string {
		return portfolio.id ?? String(index);
	}

	trackByItemId(index: number, item: RoadmapItem): string {
		return item.id ?? String(index);
	}

	private earliestDate(): string | null {
		const list = this.items();
		if (list.length === 0) return null;
		return list.reduce((min, i) => (i.startDate < min ? i.startDate : min), list[0].startDate);
	}

	private latestDate(): string | null {
		const list = this.items();
		if (list.length === 0) return null;
		return list.reduce((max, i) => (i.endDate > max ? i.endDate : max), list[0].endDate);
	}

	private formatMonthLabel(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
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

	private loadProjects(portfolioId: string): void {
		this.projectService.getProjectsByPortfolio(portfolioId).subscribe({
			next: (projects) => this.projects.set(projects),
			error: () => this.projects.set([]),
		});
	}

	private loadRoadmapItems(portfolioId: string): void {
		this.isLoadingItems.set(true);

		this.roadmapService.getRoadmapByPortfolio(portfolioId).subscribe({
			next: (items) => {
				this.items.set(items);
				this.isLoadingItems.set(false);
			},
			error: () => {
				this.items.set([]);
				this.isLoadingItems.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível carregar o roadmap deste portfólio.' });
			},
		});
	}
}
