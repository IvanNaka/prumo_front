import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import {
  AcaoProjeto,
  ACOES_POR_STATUS,
  projetoEhFinal,
  ProjetoDetalhe,
  ROTULO_ACAO_PROJETO,
} from '../../../core/models/projeto';
import {
  DESCRICAO_CATEGORIA,
  ROTULO_AVALIACAO_STATUS,
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  ROTULO_PROJETO_STATUS,
  ROTULO_TIPO_CRITERIO,
} from '../../../core/models/rotulos';
import { PortfolioContextService } from '../../../core/services/portfolio-context.service';
import { ProjetosService } from '../../../core/services/projetos.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { badgeAvaliacao, badgePrioridade, badgeProjeto, brl, data, dataHora, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';
import { OkrAssociacoes } from '../../../shared/okr-associacoes';
import { OkrsService } from '../../../core/services/okrs.service';
import { ProjetoForm } from '../projeto-form';
import { AbaOrcamento } from './aba-orcamento';
import { AbaBusinessCase } from './aba-business-case';
import { AuthService } from '../../../core/services/auth.service';

export type AbaProjeto = 'resumo' | 'avaliacao' | 'okrs' | 'orcamento' | 'business-case';

/** Detalhe do projeto (/projetos/{id}) — roteiro do Cap. 4, Parte 2. */
@Component({
  selector: 'app-projeto-detalhe',
  imports: [RouterLink, TemPerfilDirective, ConfirmDialog, ProjetoForm, OkrAssociacoes, AbaOrcamento, AbaBusinessCase],
  templateUrl: './projeto-detalhe.html',
})
export class ProjetoDetalhePage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ProjetosService);
  private readonly contexto = inject(PortfolioContextService);
  private readonly toast = inject(ToastService);
  private readonly okrsService = inject(OkrsService);
  private readonly auth = inject(AuthService);

  /** Aba "Orçamento": perfis que podem ver o financeiro (Seção 3.6). */
  readonly veFinanceiro = () => this.auth.temPerfil(PERMISSOES.verFinanceiro);

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PROJETO_STATUS;
  readonly rotuloAvaliacao = ROTULO_AVALIACAO_STATUS;
  readonly rotuloCategoria = ROTULO_CATEGORIA;
  readonly descricaoCategoria = DESCRICAO_CATEGORIA;
  readonly rotuloPrioridade = ROTULO_PRIORIDADE;
  readonly rotuloTipo = ROTULO_TIPO_CRITERIO;
  readonly rotuloAcao = ROTULO_ACAO_PROJETO;
  readonly badgeProjeto = badgeProjeto;
  readonly badgePrioridade = badgePrioridade;
  readonly badgeAvaliacao = badgeAvaliacao;
  readonly brl = brl;
  readonly num = num;
  readonly data = data;
  readonly dataHora = dataHora;

  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id')!)), { requireSync: true });
  readonly projeto = signal<ProjetoDetalhe | null>(null);
  readonly aba = signal<AbaProjeto>('resumo');
  readonly editando = signal(false);
  readonly acaoPendente = signal<AcaoProjeto | null>(null);

  readonly portfolioEncerrado = computed(() => this.projeto()?.portfolioStatus === 'Encerrado');
  readonly somenteLeitura = computed(() => {
    const p = this.projeto();
    return !p || this.portfolioEncerrado() || projetoEhFinal(p.status);
  });

  /** Somente os botões válidos para o status atual (mapa igual ao da máquina de estados). */
  readonly acoes = computed<AcaoProjeto[]>(() => {
    const p = this.projeto();
    return p && !this.portfolioEncerrado() ? ACOES_POR_STATUS[p.status] : [];
  });

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.service.obter(this.id()).subscribe({
      next: (p) => {
        this.projeto.set(p);
        if (this.contexto.ativoId() !== p.portfolioId) {
          this.contexto.selecionar(p.portfolioId).subscribe({ error: () => undefined });
        }
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  solicitar(acao: AcaoProjeto): void {
    if (acao === 'Cancelar') {
      this.acaoPendente.set(acao); // "Cancelar" pede confirmação
      return;
    }
    this.executar(acao);
  }

  executar(acao: AcaoProjeto): void {
    this.acaoPendente.set(null);
    this.service.alterarStatus(this.id(), acao).subscribe({
      next: (p) => {
        this.projeto.set(p);
        this.toast.sucesso(`Status do projeto: ${this.rotuloStatus[p.status]}.`);
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)), // RN22
    });
  }

  associarOkr(okrId: string): void {
    this.okrsService.associarProjeto(this.id(), okrId).subscribe({
      next: () => {
        this.toast.sucesso('OKR associado ao projeto.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)), // RN14
    });
  }

  desassociarOkr(okrId: string): void {
    this.okrsService.desassociarProjeto(this.id(), okrId).subscribe({
      next: () => {
        this.toast.sucesso('OKR removido do projeto.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvo(projeto: ProjetoDetalhe): void {
    this.editando.set(false);
    this.projeto.set(projeto);
  }
}
