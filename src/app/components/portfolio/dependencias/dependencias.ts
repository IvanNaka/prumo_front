import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_PROJETO_STATUS } from '../../../core/models/rotulos';
import { Dependencia, DependenciasService } from '../../../core/services/dependencias.service';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { badgeProjeto } from '../../../shared/cores';
import { NovaDependencia } from '../../../shared/nova-dependencia';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** RF27, RF28 — dependências do portfólio (Origem → Destino) com o risco de cada uma (F13). */
@Component({
  selector: 'app-dependencias',
  imports: [RouterLink, TemPerfilDirective, NovaDependencia],
  templateUrl: './dependencias.html',
})
export class Dependencias {
  private readonly service = inject(DependenciasService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PROJETO_STATUS;
  readonly badgeProjeto = badgeProjeto;

  readonly portfolioId = this.contexto.ativoId;
  readonly encerrado = this.contexto.encerrado;
  readonly dependencias = signal<Dependencia[]>([]);
  readonly carregando = signal(true);
  readonly formAberto = signal(false);
  readonly emRisco = computed(() => this.dependencias().filter((d) => d.emRisco).length);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    const id = this.portfolioId();
    if (!id) return;
    this.carregando.set(true);
    this.service.doPortfolio(id).subscribe({
      next: (lista) => {
        this.dependencias.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  salvo(): void {
    this.formAberto.set(false);
    this.carregar();
  }

  excluir(dependencia: Dependencia): void {
    this.service.excluir(dependencia.id).subscribe({
      next: () => {
        this.toast.sucesso('Dependência removida.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
