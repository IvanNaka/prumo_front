import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
	CreateIntegrationDto,
	Integration,
	IntegrationsService,
	IntegrationType,
	UpdateIntegrationDto,
} from '../../services/integrationsService';

const INTEGRATION_TYPES: { value: IntegrationType; label: string; supported: boolean }[] = [
	{ value: 'Jira', label: 'Jira', supported: true },
	{ value: 'AzureDevOps', label: 'Azure DevOps', supported: false },
	{ value: 'GitHub', label: 'GitHub', supported: false },
	{ value: 'Trello', label: 'Trello', supported: false },
];

const STATUS_LABELS: Record<string, string> = {
	Success: 'Sincronizado com sucesso',
	Unavailable: 'Indisponível',
	AuthenticationFailed: 'Falha de autenticação',
};

@Component({
	selector: 'app-integracoes',
	imports: [ReactiveFormsModule],
	templateUrl: './integracoes.html',
	styleUrl: './integracoes.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Integracoes {
	private readonly fb = inject(FormBuilder);
	private readonly integrationsService = inject(IntegrationsService);

	readonly integrationTypes = INTEGRATION_TYPES;

	readonly isLoading = signal(false);
	readonly isSaving = signal(false);
	readonly isSyncingId = signal<string | null>(null);
	readonly deletingId = signal<string | null>(null);

	readonly integrations = signal<Integration[]>([]);
	readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

	readonly showForm = signal(false);
	readonly editingIntegration = signal<Integration | null>(null);
	readonly createSubmitted = signal(false);

	readonly pendingDeleteIntegration = signal<Integration | null>(null);

	readonly isEditing = computed(() => this.editingIntegration() !== null);

	readonly integrationForm = this.fb.nonNullable.group({
		type: ['Jira' as IntegrationType, [Validators.required]],
		apiUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+[^/]$/)]],
		token: [''],
		syncIntervalMinutes: [60, [Validators.required, Validators.min(1)]],
		isActive: [true],
	});

	get controls() {
		return this.integrationForm.controls;
	}

	constructor() {
		this.loadIntegrations();
	}

	trackByIntegrationId(index: number, integration: Integration): string {
		return integration.id ?? String(index);
	}

	isTypeSupported(type: IntegrationType): boolean {
		return this.integrationTypes.find((t) => t.value === type)?.supported ?? false;
	}

	getTypeLabel(type: IntegrationType): string {
		return this.integrationTypes.find((t) => t.value === type)?.label ?? type;
	}

	getStatusLabel(status?: string | null): string {
		if (!status) return 'Nunca sincronizado';
		return STATUS_LABELS[status] ?? status;
	}

	formatDate(iso?: string | null): string {
		if (!iso) return 'Nunca sincronizado';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	openCreateForm(): void {
		this.editingIntegration.set(null);
		this.createSubmitted.set(false);
		this.integrationForm.reset({
			type: 'Jira',
			apiUrl: '',
			token: '',
			syncIntervalMinutes: 60,
			isActive: true,
		});
		this.integrationForm.controls.token.setValidators([Validators.required]);
		this.integrationForm.controls.token.updateValueAndValidity();
		this.integrationForm.controls.type.enable();
		this.showForm.set(true);
	}

	openEditForm(integration: Integration): void {
		this.editingIntegration.set(integration);
		this.createSubmitted.set(false);
		this.integrationForm.reset({
			type: integration.type,
			apiUrl: integration.apiUrl,
			token: '',
			syncIntervalMinutes: integration.syncIntervalMinutes,
			isActive: integration.isActive,
		});
		// Token é opcional na edição — só valida se o usuário decidir preenchê-lo.
		this.integrationForm.controls.token.clearValidators();
		this.integrationForm.controls.token.updateValueAndValidity();
		this.integrationForm.controls.type.disable();
		this.showForm.set(true);
	}

	closeForm(): void {
		this.showForm.set(false);
		this.editingIntegration.set(null);
		this.createSubmitted.set(false);
	}

	onSubmit(): void {
		this.createSubmitted.set(true);
		this.feedback.set(null);

		if (this.integrationForm.invalid) {
			this.integrationForm.markAllAsTouched();
			return;
		}

		const editing = this.editingIntegration();
		const values = this.integrationForm.getRawValue();

		this.isSaving.set(true);

		if (editing) {
			const payload: UpdateIntegrationDto = {
				apiUrl: values.apiUrl.trim(),
				token: values.token?.trim() ? values.token.trim() : null,
				isActive: values.isActive,
				syncIntervalMinutes: values.syncIntervalMinutes,
			};

			this.integrationsService.updateIntegration(editing.id, payload).subscribe({
				next: (updated) => {
					this.isSaving.set(false);
					this.integrations.update((current) =>
						current.map((i) => (i.id === updated.id ? updated : i))
					);
					this.closeForm();
					this.feedback.set({ kind: 'success', text: 'Integração atualizada com sucesso.' });
				},
				error: (error: HttpErrorResponse) => {
					this.isSaving.set(false);
					this.feedback.set({ kind: 'error', text: this.mapError(error) });
				},
			});
			return;
		}

		const payload: CreateIntegrationDto = {
			type: values.type,
			apiUrl: values.apiUrl.trim(),
			token: values.token.trim(),
			syncIntervalMinutes: values.syncIntervalMinutes,
		};

		this.integrationsService.createIntegration(payload).subscribe({
			next: (created) => {
				this.isSaving.set(false);
				this.integrations.update((current) => [created, ...current]);
				this.closeForm();
				this.feedback.set({ kind: 'success', text: 'Integração configurada com sucesso.' });
			},
			error: (error: HttpErrorResponse) => {
				this.isSaving.set(false);
				this.feedback.set({ kind: 'error', text: this.mapError(error) });
			},
		});
	}

	syncIntegration(integration: Integration): void {
		this.feedback.set(null);
		this.isSyncingId.set(integration.id);

		this.integrationsService.syncIntegration(integration.id).subscribe({
			next: () => {
				this.isSyncingId.set(null);
				this.feedback.set({ kind: 'success', text: 'Sincronização concluída com sucesso.' });
				this.loadIntegrations();
			},
			error: (error: HttpErrorResponse) => {
				this.isSyncingId.set(null);
				this.feedback.set({ kind: 'error', text: this.mapError(error, 'sync') });
				this.loadIntegrations();
			},
		});
	}

	requestDelete(integration: Integration): void {
		this.pendingDeleteIntegration.set(integration);
	}

	cancelDelete(): void {
		this.pendingDeleteIntegration.set(null);
	}

	confirmDelete(): void {
		const integration = this.pendingDeleteIntegration();
		if (!integration) return;

		this.deletingId.set(integration.id);
		this.integrationsService.deleteIntegration(integration.id).subscribe({
			next: () => {
				this.deletingId.set(null);
				this.integrations.update((current) => current.filter((i) => i.id !== integration.id));
				this.cancelDelete();
				this.feedback.set({ kind: 'success', text: 'Integração removida com sucesso.' });
			},
			error: (error: HttpErrorResponse) => {
				this.deletingId.set(null);
				this.cancelDelete();
				this.feedback.set({ kind: 'error', text: this.mapError(error) });
			},
		});
	}

	private loadIntegrations(): void {
		this.isLoading.set(true);

		this.integrationsService.getIntegrations().subscribe({
			next: (integrations) => {
				this.integrations.set(integrations);
				this.isLoading.set(false);
			},
			error: () => {
				this.integrations.set([]);
				this.isLoading.set(false);
				this.feedback.set({ kind: 'error', text: 'Não foi possível carregar as integrações.' });
			},
		});
	}

	private mapError(error: HttpErrorResponse, context: 'save' | 'sync' = 'save'): string {
		if (error.status === 401) {
			return context === 'sync'
				? 'Falha de autenticação ao sincronizar. Verifique o e-mail/token configurado.'
				: 'Credenciais rejeitadas. Confira o e-mail e o token informados.';
		}

		if (error.status === 403) {
			return 'Você não tem permissão (role Admin) para realizar esta ação.';
		}

		if (error.status === 400) {
			return 'Dados inválidos. Verifique o tipo, a URL e o token informados.';
		}

		if (error.status === 502) {
			return 'Não foi possível se comunicar com o serviço externo no momento.';
		}

		return context === 'sync'
			? 'Não foi possível sincronizar a integração no momento.'
			: 'Não foi possível salvar a integração no momento.';
	}
}
