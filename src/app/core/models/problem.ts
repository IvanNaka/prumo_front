import { HttpErrorResponse } from '@angular/common/http';

/** Corpo ProblemDetails devolvido pela API (Seção 3.3). */
export interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Extrai a mensagem `detail` de um erro HTTP; usa `fallback` quando não houver. */
export function mensagemDeErro(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ProblemDetails | string | null;
    if (body && typeof body === 'object' && body.detail) {
      return body.detail;
    }
    if (typeof body === 'string' && body.trim().length > 0 && body.length < 300) {
      return body;
    }
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }
  }
  return fallback;
}
