import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

/** Notificações na tela (toast). O front-end mostra aqui o `detail` dos erros da API. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequencia = 0;
  readonly toasts = signal<Toast[]>([]);

  sucesso(mensagem: string): void {
    this.mostrar('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.mostrar('erro', mensagem, 6000);
  }

  aviso(mensagem: string): void {
    this.mostrar('aviso', mensagem);
  }

  info(mensagem: string): void {
    this.mostrar('info', mensagem);
  }

  fechar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: ToastTipo, mensagem: string, duracao = 4000): void {
    const id = ++this.sequencia;
    this.toasts.update((lista) => [...lista, { id, tipo, mensagem }]);
    setTimeout(() => this.fechar(id), duracao);
  }
}
