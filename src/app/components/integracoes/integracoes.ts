import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, timer } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ROTULO_INTEGRACAO_STATUS } from '../../core/models/rotulos';
import { mensagemDeErro } from '../../core/models/problem';
import { IntegracaoJira, IntegracoesService, SincronizacaoLog } from '../../core/services/integracoes.service';
import { ToastService } from '../../core/services/toast.service';
import { badgeIntegracao, dataHora } from '../../shared/cores';

/** UC15 / RF47, RF51 — configuração e teste da conexão com o Jira. */
@Component({
  selector: 'app-integracoes',
  imports: [ReactiveFormsModule],
  templateUrl: './integracoes.html',
})
export class Integracoes {
  private readonly service = inject(IntegracoesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly rotuloStatus = ROTULO_INTEGRACAO_STATUS;
  readonly badge = badgeIntegracao;
  readonly dataHora = dataHora;

  readonly integracao = signal<IntegracaoJira | null>(null);
  readonly logs = signal<SincronizacaoLog[]>([]);
  readonly salvando = signal(false);
  readonly testando = signal(false);
  readonly sincronizando = signal(false);
  /** Resumo do último log depois de "Sincronizar agora". */
  readonly resumo = signal<SincronizacaoLog | null>(null);

  readonly form = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i), Validators.maxLength(300)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    apiToken: [''],
    intervaloSincronizacaoMinutos: [60, [Validators.required, Validators.min(15), Validators.max(1440)]],
    ativo: [true],
  });

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.service.obter().subscribe({
      next: (i) => {
        this.aplicar(i, true);
        if (i.status === 'Sincronizando') {
          this.acompanharSincronizacao();
        }
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.carregarLogs();
  }

  /** Estado atual sem mexer no formulário (ex.: depois de um 400 RN24 a configuração fica salva). */
  private atualizarStatus(): void {
    this.service.obter().subscribe({ next: (i) => this.aplicar(i, false) });
  }

  carregarLogs(): void {
    this.service.logs().subscribe({ next: (l) => this.logs.set(l) });
  }

  private aplicar(i: IntegracaoJira, preencherForm: boolean): void {
    this.integracao.set(i);
    if (preencherForm) {
      this.form.reset({
        url: i.url,
        email: i.email,
        apiToken: '',
        intervaloSincronizacaoMinutos: i.intervaloSincronizacaoMinutos || 60,
        ativo: i.configurada ? i.ativo : true,
      });
    }
    // Na criação o token é obrigatório; em edição, vazio = manter o atual.
    const token = this.form.controls.apiToken;
    token.setValidators(i.tokenConfigurado ? [] : [Validators.required]);
    token.updateValueAndValidity();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.service
      .salvar({ ...v, url: v.url.trim(), email: v.email.trim(), apiToken: v.apiToken || null })
      .subscribe({
        next: (i) => {
          this.salvando.set(false);
          this.aplicar(i, true);
          if (i.status === 'Conectada') {
            this.toast.sucesso('Configuração salva. Conexão com o Jira estabelecida.');
          } else {
            this.toast.erro('Configuração salva, mas não foi possível conectar ao Jira. Verifique URL, e-mail e token.');
          }
        },
        error: (e) => {
          this.salvando.set(false);
          this.toast.erro(mensagemDeErro(e));
          this.atualizarStatus();
        },
      });
  }

  testar(): void {
    this.testando.set(true);
    this.service.testar().subscribe({
      next: (i) => {
        this.testando.set(false);
        this.aplicar(i, false);
        if (i.status === 'Conectada') {
          this.toast.sucesso('Conexão com o Jira estabelecida.');
        } else {
          this.toast.erro('Não foi possível conectar ao Jira. Verifique URL, e-mail e token.');
        }
      },
      error: (e) => {
        this.testando.set(false);
        this.toast.erro(mensagemDeErro(e));
        this.atualizarStatus();
      },
    });
  }

  podeSincronizar(i: IntegracaoJira): boolean {
    return i.status === 'Conectada' || i.status === 'FalhaSincronizacao';
  }

  /** UC16: dispara a sincronização (202) e acompanha o status. */
  sincronizar(): void {
    this.resumo.set(null);
    this.service.sincronizar().subscribe({
      next: (i) => {
        this.aplicar(i, false);
        this.acompanharSincronizacao();
      },
      error: (e) => {
        this.toast.erro(mensagemDeErro(e));
        this.atualizarStatus();
      },
    });
  }

  /** Consulta GET /integracoes/jira a cada 3 s até o status sair de Sincronizando. */
  private acompanharSincronizacao(): void {
    this.sincronizando.set(true);
    timer(3000, 3000)
      .pipe(
        switchMap(() => this.service.obter()),
        filter((i) => i.status !== 'Sincronizando'),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (i) => {
          this.sincronizando.set(false);
          this.aplicar(i, false);
          this.service.logs().subscribe({
            next: (logs) => {
              this.logs.set(logs);
              const ultimo = logs[0] ?? null;
              this.resumo.set(ultimo);
              if (ultimo?.sucesso) {
                this.toast.sucesso(`Sincronização concluída: ${ultimo.issuesProcessadas} issues e ${ultimo.worklogsProcessados} worklogs.`);
              } else if (ultimo) {
                this.toast.erro(ultimo.mensagemErro || 'A sincronização falhou.');
              }
            },
          });
        },
        error: (e) => {
          this.sincronizando.set(false);
          this.toast.erro(mensagemDeErro(e));
        },
      });
  }
}
