import { Component, inject, signal } from '@angular/core';
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

  readonly rotuloStatus = ROTULO_INTEGRACAO_STATUS;
  readonly badge = badgeIntegracao;
  readonly dataHora = dataHora;

  readonly integracao = signal<IntegracaoJira | null>(null);
  readonly logs = signal<SincronizacaoLog[]>([]);
  readonly salvando = signal(false);
  readonly testando = signal(false);

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
      next: (i) => this.aplicar(i, true),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.carregarLogs();
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
      },
    });
  }
}
