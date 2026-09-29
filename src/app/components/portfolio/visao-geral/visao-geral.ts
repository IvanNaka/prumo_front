import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { PERMISSOES } from '../../../core/models/permissoes';
import {
  AcaoPortfolio,
  ACOES_POR_STATUS_PORTFOLIO,
  MembroPortfolio,
  Portfolio,
  ROTULO_ACAO_PORTFOLIO,
} from '../../../core/models/portfolio';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_PORTFOLIO_STATUS, ROTULO_ROLE } from '../../../core/models/rotulos';
import { AuthService } from '../../../core/services/auth.service';
import { PortfoliosService } from '../../../core/services/portfolios.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsuarioOpcao, UsuariosService } from '../../../core/services/usuarios.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { badgePortfolio, data } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';
import { PortfolioForm } from '../../portfolios/portfolio-form';

type Aba = 'resumo' | 'membros';

/** Página do portfólio: dados, ações do ciclo de vida (Figura 27) e membros. */
@Component({
  selector: 'app-portfolio-visao-geral',
  imports: [TemPerfilDirective, ConfirmDialog, PortfolioForm],
  templateUrl: './visao-geral.html',
})
export class VisaoGeral {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PortfoliosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PORTFOLIO_STATUS;
  readonly rotuloRole = ROTULO_ROLE;
  readonly rotuloAcao = ROTULO_ACAO_PORTFOLIO;
  readonly badge = badgePortfolio;
  readonly data = data;

  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id')!)), { requireSync: true });

  readonly portfolio = signal<Portfolio | null>(null);
  readonly membros = signal<MembroPortfolio[]>([]);
  readonly usuarios = signal<UsuarioOpcao[]>([]);
  readonly aba = signal<Aba>('resumo');
  readonly editando = signal(false);
  readonly acaoPendente = signal<AcaoPortfolio | null>(null);
  readonly novoMembroId = signal('');

  readonly encerrado = computed(() => this.portfolio()?.status === 'Encerrado');
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

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.service.obter(this.id()).subscribe({
      next: (p) => this.portfolio.set(p),
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
    this.service.membros(this.id()).subscribe({
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
    this.service.adicionarMembro(this.id(), usuarioId).subscribe({
      next: (lista) => {
        this.membros.set(lista);
        this.novoMembroId.set('');
        this.toast.sucesso('Membro adicionado.');
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  removerMembro(membro: MembroPortfolio): void {
    this.service.removerMembro(this.id(), membro.usuarioId).subscribe({
      next: () => {
        this.membros.update((lista) => lista.filter((m) => m.usuarioId !== membro.usuarioId));
        this.toast.sucesso('Membro removido.');
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
    this.service.executarAcao(this.id(), acao).subscribe({
      next: (p) => {
        this.portfolio.set(p);
        this.toast.sucesso(`Status do portfólio: ${this.rotuloStatus[p.status]}.`);
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvo(portfolio: Portfolio): void {
    this.editando.set(false);
    this.portfolio.set(portfolio);
  }
}
