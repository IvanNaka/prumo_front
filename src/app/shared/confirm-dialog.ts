import { Component, input, output } from '@angular/core';

/** Diálogo de confirmação (ex.: excluir critério — UC6 passo 3, encerrar portfólio, cancelar projeto). */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="modal-overlay" (click)="cancelar.emit()">
      <div class="modal modal-sm" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
        <h2 class="card-title">{{ titulo() }}</h2>
        <p style="margin: 0.75rem 0 1.25rem; color: #334155">{{ mensagem() }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancelar.emit()">Voltar</button>
          <button type="button" class="btn" [class.btn-danger]="perigo()" [class.btn-primary]="!perigo()" (click)="confirmar.emit()">
            {{ rotuloConfirmar() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  readonly titulo = input('Confirmar');
  readonly mensagem = input('');
  readonly rotuloConfirmar = input('Confirmar');
  readonly perigo = input(true);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
