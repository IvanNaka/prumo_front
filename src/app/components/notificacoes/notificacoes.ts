import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { NOTIFICACAO_STATUS, NotificacaoStatus, TIPOS_NOTIFICACAO, TipoNotificacao } from '../../core/models/enums';
import { mensagemDeErro } from '../../core/models/problem';
import { ROTULO_NOTIFICACAO_STATUS, ROTULO_TIPO_NOTIFICACAO } from '../../core/models/rotulos';
import { Notificacao, NotificacoesService } from '../../core/services/notificacoes.service';
import { ToastService } from '../../core/services/toast.service';
import { badgeNotificacao, dataHora } from '../../shared/cores';

/** Ícone (símbolo) e cor de cada tipo de notificação. */
const ICONES: Record<TipoNotificacao, { simbolo: string; classe: string }> = {
  Atraso: { simbolo: '⏱', classe: 'icon-yellow' },
  Risco: { simbolo: '⚠', classe: 'icon-red' },
  Conflito: { simbolo: '⇄', classe: 'icon-purple' },
  Desalinhamento: { simbolo: '◎', classe: 'icon-blue' },
  EstouroOrcamento: { simbolo: '$', classe: 'icon-red' },
};

/** Central de notificações (RF46, Figura 30). */
@Component({
  selector: 'app-notificacoes',
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.css',
})
export class Notificacoes {
  private readonly service = inject(NotificacoesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly statusDisponiveis = NOTIFICACAO_STATUS.filter((s) => s !== 'Gerada' && s !== 'Enfileirada');
  readonly tipos = TIPOS_NOTIFICACAO;
  readonly rotuloTipo = ROTULO_TIPO_NOTIFICACAO;
  readonly rotuloStatus = ROTULO_NOTIFICACAO_STATUS;
  readonly icones = ICONES;
  readonly badge = badgeNotificacao;
  readonly dataHora = dataHora;

  /** Vazio = padrão da API (Enviada, Lida e Ignorada). */
  readonly filtroStatus = signal<NotificacaoStatus | ''>('');
  readonly filtroTipo = signal<TipoNotificacao | ''>('');
  readonly itens = signal<Notificacao[]>([]);
  readonly carregando = signal(true);

  constructor() {
    this.carregar();
  }

  filtrarStatus(valor: string): void {
    this.filtroStatus.set(valor as NotificacaoStatus | '');
    this.carregar();
  }

  filtrarTipo(valor: string): void {
    this.filtroTipo.set(valor as TipoNotificacao | '');
    this.carregar();
  }

  carregar(): void {
    const status = this.filtroStatus();
    const tipo = this.filtroTipo();
    this.carregando.set(true);
    this.service.listar(status ? [status] : [], tipo ? [tipo] : []).subscribe({
      next: (lista) => {
        this.itens.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
    this.service.atualizarContagem();
  }

  /** Link para a entidade relacionada. */
  link(n: Notificacao): string[] | null {
    switch (n.entidadeTipo) {
      case 'Projeto':
      case 'Dependencia':
        return n.projetoId ? ['/projetos', n.projetoId] : null;
      case 'Equipe':
        return n.entidadeId ? ['/equipes', n.entidadeId, 'capacidade'] : null;
      case 'Integracao':
        return ['/integracoes/jira'];
      default:
        return null;
    }
  }

  /** Abrir uma notificação marca-a como lida automaticamente. */
  abrir(n: Notificacao): void {
    const destino = this.link(n);
    const navegar = () => {
      if (destino) void this.router.navigate(destino);
    };
    if (n.status === 'Enviada') {
      this.service.marcarLida(n.id).subscribe({
        next: (atualizada) => {
          this.substituir(atualizada);
          navegar();
        },
        error: () => navegar(),
      });
    } else {
      navegar();
    }
  }

  marcarLida(n: Notificacao): void {
    this.service.marcarLida(n.id).subscribe({
      next: (atualizada) => this.substituir(atualizada),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  arquivar(n: Notificacao): void {
    this.service.arquivar(n.id).subscribe({
      next: (atualizada) => {
        if (this.filtroStatus() === 'Arquivada') {
          this.substituir(atualizada);
        } else {
          this.itens.update((lista) => lista.filter((i) => i.id !== n.id));
        }
        this.toast.sucesso('Notificação arquivada.');
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  private substituir(atualizada: Notificacao): void {
    this.itens.update((lista) => lista.map((i) => (i.id === atualizada.id ? { ...i, ...atualizada, projetoId: i.projetoId } : i)));
  }
}
