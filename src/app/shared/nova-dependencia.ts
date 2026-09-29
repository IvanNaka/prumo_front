import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { mensagemDeErro } from '../core/models/problem';
import { ProjetoResumo } from '../core/models/projeto';
import { DependenciasService } from '../core/services/dependencias.service';
import { ProjetosService } from '../core/services/projetos.service';
import { ToastService } from '../core/services/toast.service';

/** Diálogo "Nova dependência": Origem (depende de) → Destino (UC12). */
@Component({
  selector: 'app-nova-dependencia',
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="fechar.emit()">
      <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="card-header">
          <h2 class="card-title">Nova dependência</h2>
          <button type="button" class="btn btn-link" (click)="fechar.emit()">Fechar</button>
        </div>
        <form class="form-grid" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
          <div class="field">
            <label for="origem">Projeto (origem) *</label>
            <select id="origem" formControlName="projetoOrigemId">
              <option value="" disabled>Selecione</option>
              @for (p of projetos(); track p.id) {
                <option [value]="p.id">{{ p.nome }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="destino">Depende de (destino) *</label>
            <select id="destino" formControlName="projetoDestinoId">
              <option value="" disabled>Selecione</option>
              @for (p of projetos(); track p.id) {
                <option [value]="p.id" [disabled]="p.id === form.controls.projetoOrigemId.value">{{ p.nome }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="descricao">Descrição</label>
            <textarea id="descricao" formControlName="descricao" maxlength="500"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="fechar.emit()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || salvando()">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NovaDependencia implements OnInit {
  private readonly service = inject(DependenciasService);
  private readonly projetosService = inject(ProjetosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly portfolioId = input.required<string>();
  /** Pré-seleciona a origem (quando aberto a partir de um projeto). */
  readonly origemId = input<string | null>(null);
  readonly salvo = output<void>();
  readonly fechar = output<void>();

  readonly projetos = signal<ProjetoResumo[]>([]);
  readonly salvando = signal(false);

  readonly form = this.fb.nonNullable.group({
    projetoOrigemId: ['', [Validators.required]],
    projetoDestinoId: ['', [Validators.required]],
    descricao: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    if (this.origemId()) {
      this.form.controls.projetoOrigemId.setValue(this.origemId()!);
    }
    this.projetosService.listar(this.portfolioId()).subscribe({
      next: (lista) => this.projetos.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvar(): void {
    const valores = this.form.getRawValue();
    this.salvando.set(true);
    this.service.criar({ ...valores, descricao: valores.descricao || null }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Dependência cadastrada.');
        this.salvo.emit();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e)); // RN19, RN20, RN21
      },
    });
  }
}
