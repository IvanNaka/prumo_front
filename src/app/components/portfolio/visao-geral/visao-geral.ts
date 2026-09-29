import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Criterio } from '../../../core/models/criterio';
import { PERMISSOES } from '../../../core/models/permissoes';
import {
  AcaoPortfolio,
  ACOES_POR_STATUS_PORTFOLIO,
  MembroPortfolio,
  Portfolio,
  ROTULO_ACAO_PORTFOLIO,
} from '../../../core/models/portfolio';
import { mensagemDeErro } from '../../../core/models/problem';
import { ProjetoResumo } from '../../../core/models/projeto';
import {
  ROTULO_PORTFOLIO_STATUS,
  ROTULO_PROJETO_STATUS,
  ROTULO_ROLE,
  ROTULO_TIPO_CRITERIO,
} from '../../../core/models/rotulos';
import { AuthService } from '../../../core/services/auth.service';
import { CriteriosService } from '../../../core/services/criterios.service';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import { PortfoliosService } from '../../../core/services/portfolios.service';
import { ProjetosService } from '../../../core/services/projetos.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsuarioOpcao, UsuariosService } from '../../../core/services/usuarios.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { badgePortfolio, badgeProjeto, data, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';
import { PortfolioForm } from '../../portfolios/portfolio-form';
import { OkrAssociacoes } from '../../../shared/okr-associacoes';
import { Okr, OkrsService } from '../../../core/services/okrs.service';

type Aba = 'resumo' | 'membros';

/**
 * Visão geral do portfólio ativo (UC3, passo 5): dados, lista de projetos e de critérios,
 * ações do ciclo de vida (Figura 27) e membros.
 */
@Component({
  selector: 'app-portfolio-visao-geral',
  imports: [TemPerfilDirective, ConfirmDialog, PortfolioForm, RouterLink, OkrAssociacoes],
  templateUrl: './visao-geral.html',
})
export class VisaoGeral {
  private readonly contexto = inject(PortfolioContextService);
  private readonly service = inject(PortfoliosService);
  private readonly criteriosService = inject(CriteriosService);
  private readonly projetosService = inject(ProjetosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly okrsService = inject(OkrsService);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PORTFOLIO_STATUS;
  readonly rotuloProjeto = ROTULO_PROJETO_STATUS;
  readonly rotuloTipo = ROTULO_TIPO_CRITERIO;
  readonly rotuloRole = ROTULO_ROLE;
  readonly rotuloAcao = ROTULO_ACAO_PORTFOLIO;
  readonly badge = badgePortfolio;
  readonly badgeProjeto = badgeProjeto;
  readonly data = data;
  readonly num = num;

  readonly portfolio = this.contexto.ativo;
  readonly projetos = signal<ProjetoResumo[]>([]);
  readonly criterios = signal<Criterio[]>([]);
  readonly okrs = signal<Okr[]>([]);
  readonly membros = signal<MembroPortfolio[]>([]);
  readonly usuarios = signal<UsuarioOpcao[]>([]);
  readonly aba = signal<Aba>('resumo');
  readonly editando = signal(false);
  readonly acaoPendente = signal<AcaoPortfolio | null>(null);
  readonly novoMembroId = signal('');

  readonly encerrado = this.contexto.encerrado;
  readonly acoes = computed(() => {
    const p = this.portfolio();
    return p ? ACOES_POR_STATUS_PORTFOLIO[p.status] : [];
  });

  /** Aba "Membros": só o responsável do portfólio e o Administrador. */
  readonly podeGerirMembros = computed(() => {
    const p = this.portfolio();
    return !!p && (p.responsavelId === this.auth.getUserId() || this.auth.perfis().includes('Administrador'));
  });

  readonly candidatos = computed(() => {
    const atuais = new Set(this.membros().map((m) => m.usuarioId));
    return this.usuarios().filter((u) => !atuais.has(u.id));
  });

  private carregadoPara: string | null = null;

  constructor() {
    // Recarrega as listas quando o portfólio ativo muda (ex.: "Trocar").
    effect(() => {
      const p = this.portfolio();
      if (p && p.id !== this.carregadoPara) {
        this.carregadoPara = p.id;
        this.aba.set('resumo');
        this.carregarListas(p.id);
      }
    });
  }

  private carregarListas(id: string): void {
    this.projetosService.listar(id).subscribe({
      next: (lista) => this.projetos.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.criteriosService.listar(id).subscribe({
      next: (lista) => this.criterios.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.carregarOkrs(id);
  }

  private carregarOkrs(id: string): void {
    this.okrsService.doPortfolio(id).subscribe({
      next: (lista) => this.okrs.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  associarOkr(okrId: string): void {
    const id = this.portfolio()!.id;
    this.okrsService.associarPortfolio(id, okrId).subscribe({
      next: () => {
        this.toast.sucesso('OKR associado ao portfólio.');
        this.carregarOkrs(id);
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)), // RN14
    });
  }

  desassociarOkr(okrId: string): void {
    const id = this.portfolio()!.id;
    this.okrsService.desassociarPortfolio(id, okrId).subscribe({
      next: () => {
        this.toast.sucesso('OKR removido do portfólio.');
        this.carregarOkrs(id);
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  abrirAba(aba: Aba): void {
    this.aba.set(aba);
    if (aba === 'membros') {
      this.carregarMembros();
    }
  }

  carregarMembros(): void {
    const id = this.portfolio()!.id;
    this.service.membros(id).subscribe({
      next: (lista) => this.membros.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    if (this.usuarios().length === 0) {
      this.usuariosService.ativos().subscribe({ next: (lista) => this.usuarios.set(lista) });
    }
  }

  adicionarMembro(): void {
    const usuarioId = this.novoMembroId();
    if (!usuarioId) {
      return;
    }
    this.service.adicionarMembro(this.portfolio()!.id, usuarioId).subscribe({
      next: (lista) => {
        this.membros.set(lista);
        this.novoMembroId.set('');
        this.toast.sucesso('Membro adicionado.');
        this.contexto.recarregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  removerMembro(membro: MembroPortfolio): void {
    this.service.removerMembro(this.portfolio()!.id, membro.usuarioId).subscribe({
      next: () => {
        this.membros.update((lista) => lista.filter((m) => m.usuarioId !== membro.usuarioId));
        this.toast.sucesso('Membro removido.');
        this.contexto.recarregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  solicitarAcao(acao: AcaoPortfolio): void {
    if (acao === 'encerrar') {
      this.acaoPendente.set(acao); // pede confirmação
      return;
    }
    this.executarAcao(acao);
  }

  executarAcao(acao: AcaoPortfolio): void {
    this.acaoPendente.set(null);
    this.service.executarAcao(this.portfolio()!.id, acao).subscribe({
      next: (p) => {
        this.contexto.definir(p);
        this.toast.sucesso(`Status do portfólio: ${this.rotuloStatus[p.status]}.`);
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvo(portfolio: Portfolio): void {
    this.editando.set(false);
    this.contexto.definir(portfolio);
  }
}
