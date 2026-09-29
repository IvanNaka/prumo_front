import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensagemDeErro } from '../../core/models/problem';
import { PortfolioContextService } from '../../core/services/portfolio-context.service';
import { FormatoRelatorio, RelatorioHistorico, RelatoriosService, TipoRelatorio } from '../../core/services/relatorios.service';
import { ToastService } from '../../core/services/toast.service';
import { dataHora } from '../../shared/cores';

/** RF43, RF44 — relatório do portfólio e relatório executivo em PDF e Excel, com histórico. */
@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.html',
})
export class Relatorios {
  private readonly service = inject(RelatoriosService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);

  readonly dataHora = dataHora;
  readonly portfolioId = this.contexto.ativoId;
  readonly historico = signal<RelatorioHistorico[]>([]);
  /** "tipo-formato" em geração, para mostrar o spinner no botão. */
  readonly gerando = signal<string | null>(null);

  readonly cartoes: { tipo: TipoRelatorio; titulo: string; descricao: string }[] = [
    {
      tipo: 'portfolio',
      titulo: 'Relatório do portfólio',
      descricao: 'Dados do portfólio, critérios, ranking completo, projetos (orçamento, custo realizado, OKRs) e dependências em risco.',
    },
    {
      tipo: 'executivo',
      titulo: 'Relatório executivo',
      descricao: 'Os 8 indicadores do dashboard, top 5 do ranking, projetos críticos e alertas abertos.',
    },
  ];

  constructor() {
    this.carregarHistorico();
  }

  carregarHistorico(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.service.historico(id).subscribe({
      next: (h) => this.historico.set(h),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  gerar(tipo: TipoRelatorio, formato: FormatoRelatorio): void {
    const id = this.portfolioId();
    if (!id) return;
    this.gerando.set(`${tipo}-${formato}`);
    this.service.gerar(id, tipo, formato).subscribe({
      next: (resposta) => {
        this.gerando.set(null);
        const nome = this.nomeArquivo(resposta.headers.get('content-disposition')) ?? `prumo-${tipo}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        this.baixar(resposta.body!, nome);
        this.carregarHistorico();
      },
      error: async (e: HttpErrorResponse) => {
        this.gerando.set(null);
        // Com responseType 'blob', o ProblemDetails chega como Blob.
        if (e.error instanceof Blob) {
          try {
            const problema = JSON.parse(await e.error.text()) as { detail?: string };
            if (problema.detail) {
              this.toast.erro(problema.detail);
              return;
            }
          } catch {
            /* segue para a mensagem padrão */
          }
        }
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  private nomeArquivo(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8) return decodeURIComponent(utf8[1]);
    const simples = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return simples ? simples[1] : null;
  }

  private baixar(blob: Blob, nome: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
  }
}
