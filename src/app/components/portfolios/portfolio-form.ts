import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Portfolio } from '../../core/models/portfolio';
import { mensagemDeErro } from '../../core/models/problem';
import { PortfoliosService } from '../../core/services/portfolios.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioOpcao, UsuariosService } from '../../core/services/usuarios.service';

/** Formulário de portfólio (UC2): nome*, descrição, objetivo e responsável*. */
@Component({
  selector: 'app-portfolio-form',
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="fechar.emit()">
      <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="card-header">
          <h2 class="card-title">{{ portfolio() ? 'Editar portfólio' : 'Novo portfólio' }}</h2>
          <button type="button" class="btn btn-link" (click)="fechar.emit()">Fechar</button>
        </div>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
          <div class="field">
            <label for="nome">Nome *</label>
            <input id="nome" formControlName="nome" maxlength="150" />
            @if (form.controls.nome.invalid && form.controls.nome.touched) {
              <p class="field-error">Informe o nome do portfólio.</p>
            }
          </div>

          <div class="field">
            <label for="descricao">Descrição</label>
            <textarea id="descricao" formControlName="descricao" maxlength="1000"></textarea>
          </div>

          <div class="field">
            <label for="objetivo">Objetivo do portfólio</label>
            <textarea id="objetivo" formControlName="objetivo" maxlength="1000"></textarea>
          </div>

          <div class="field">
            <label for="responsavel">Responsável *</label>
            <select id="responsavel" formControlName="responsavelId">
              <option value="" disabled>Selecione um usuário</option>
              @for (usuario of usuarios(); track usuario.id) {
                <option [value]="usuario.id">{{ usuario.nome }} ({{ usuario.email }})</option>
              }
            </select>
            @if (form.controls.responsavelId.invalid && form.controls.responsavelId.touched) {
              <p class="field-error">Selecione o responsável.</p>
            }
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
export class PortfolioForm implements OnInit {
  private readonly service = inject(PortfoliosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  /** Portfólio em edição; vazio = novo. */
  readonly portfolio = input<Portfolio | null>(null);
  readonly salvo = output<Portfolio>();
  readonly fechar = output<void>();

  readonly usuarios = signal<UsuarioOpcao[]>([]);
  readonly salvando = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: ['', [Validators.maxLength(1000)]],
    objetivo: ['', [Validators.maxLength(1000)]],
    responsavelId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const atual = this.portfolio();
    if (atual) {
      this.form.reset({
        nome: atual.nome,
        descricao: atual.descricao ?? '',
        objetivo: atual.objetivo ?? '',
        responsavelId: atual.responsavelId,
      });
    }
    this.usuariosService.ativos().subscribe({
      next: (lista) => this.usuarios.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const atual = this.portfolio();
    const dados = this.form.getRawValue();
    const req = atual ? this.service.editar(atual.id, dados) : this.service.criar(dados);
    this.salvando.set(true);
    req.subscribe({
      next: (portfolio) => {
        this.salvando.set(false);
        // UC2, passo 8
        this.toast.sucesso(atual ? 'Portfólio atualizado com sucesso.' : 'Portfólio cadastrado com sucesso.');
        this.salvo.emit(portfolio);
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }
}
