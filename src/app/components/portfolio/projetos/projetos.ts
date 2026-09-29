import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CATEGORIAS, CategoriaEstrategica, PROJETO_STATUS, ProjetoStatus } from '../../../core/models/enums';
import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { ProjetoDetalhe, ProjetoResumo } from '../../../core/models/projeto';
import {
  ROTULO_AVALIACAO_STATUS,
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  ROTULO_PROJETO_STATUS,
} from '../../../core/models/rotulos';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import { ProjetosService } from '../../../core/services/projetos.service';
import { ToastService } from '../../../core/services/toast.service';
import { badgePrioridade, badgeProjeto, brl, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';
import { ProjetoForm } from '../../projetos/projeto-form';

/** RF10–RF13 — projetos do portfólio ativo, com filtros por status e categoria. */
@Component({
  selector: 'app-projetos',
  imports: [TemPerfilDirective, ProjetoForm],
  templateUrl: './projetos.html',
})
export class Projetos {
  private readonly service = inject(ProjetosService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly permissoes = PERMISSOES;
  readonly statusList = PROJETO_STATUS;
  readonly categorias = CATEGORIAS;
  readonly rotuloStatus = ROTULO_PROJETO_STATUS;
  readonly rotuloCategoria = ROTULO_CATEGORIA;
  readonly rotuloPrioridade = ROTULO_PRIORIDADE;
  readonly rotuloAvaliacao = ROTULO_AVALIACAO_STATUS;
  readonly badgeProjeto = badgeProjeto;
  readonly badgePrioridade = badgePrioridade;
  readonly brl = brl;
  readonly num = num;

  readonly portfolioId = this.contexto.ativoId;
  readonly encerrado = this.contexto.encerrado;
  readonly projetos = signal<ProjetoResumo[]>([]);
  readonly carregando = signal(true);
  readonly filtroStatus = signal<ProjetoStatus | ''>('');
  readonly filtroCategoria = signal<CategoriaEstrategica | ''>('');
  readonly formAberto = signal(false);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    const id = this.portfolioId();
    if (!id) {
      return;
    }
    this.carregando.set(true);
    this.service.listar(id, { status: this.filtroStatus(), categoria: this.filtroCategoria() }).subscribe({
      next: (lista) => {
        this.projetos.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  filtrarStatus(valor: string): void {
    this.filtroStatus.set(valor as ProjetoStatus | '');
    this.carregar();
  }

  filtrarCategoria(valor: string): void {
    this.filtroCategoria.set(valor as CategoriaEstrategica | '');
    this.carregar();
  }

  abrir(projeto: ProjetoResumo): void {
    void this.router.navigate(['/projetos', projeto.id]);
  }

  criado(projeto: ProjetoDetalhe): void {
    this.formAberto.set(false);
    this.contexto.recarregar(); // Configurado -> EmAnalise (Figura 27)
    void this.router.navigate(['/projetos', projeto.id]);
  }
}
