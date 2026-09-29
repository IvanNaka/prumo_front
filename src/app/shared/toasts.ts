import { Component, inject } from '@angular/core';

import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.tipo" role="status">
          <span>{{ toast.mensagem }}</span>
          <button type="button" class="toast-close" aria-label="Fechar" (click)="toastService.fechar(toast.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  readonly toastService = inject(ToastService);
}
