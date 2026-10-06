import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';

import { PERMISSOES } from '../core/models/permissoes';
import { mensagemDeErro } from '../core/models/problem';
import { Okr, OkrResumo, OkrsService } from '../core/services/okrs.service';
import { ToastService } from '../core/services/toast.service';
import { num } from './cores';
import { TemPerfilDirective } from './tem-perfil.directive';

/**
 * Lista de OKRs associados (a um projeto ou ao portfólio) com o botão "Associar OKR" (UC9).
 * Quem decide o que chamar na API é o componente pai (eventos associar/desassociar).
 */
@Component({
  selector: 'app-okr-associacoes',
  imports: [TemPerfilDirective],
  template: `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">{{ titulo() }}</h2>
        @if (editavel()) {
          <div class="row" *temPerfil="permissoes.editarOkrs">
            <select class="input" style="min-width: min(240px, 100%)" [value]="selecionado()" (change)="selecionado.set($any($event.target).value)">
              <option value="">Selecione um OKR</option>
              @for (okr of disponiveis(); track okr.id) {
                <option [value]="okr.id">{{ okr.titulo }}</option>
              }
            </select>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!selecionado()" (click)="associar()">Associar OKR</button>
          </div>
        }
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>OKR</th><th style="min-width: 200px">Progresso</th><th class="actions"></th></tr>
          </thead>
          <tbody>
            @for (okr of associados(); track okr.id) {
              <tr>
                <td class="strong">{{ okr.titulo }}</td>
                <td>
                  <div class="row" style="flex-wrap: nowrap">
                    <div class="progress" style="flex: 1"><span [style.width.%]="okr.progresso"></span></div>
                    <span>{{ num(okr.progresso) }}%</span>
                  </div>
                </td>
                <td class="actions">
                  @if (editavel()) {
                    <button type="button" class="btn btn-link btn-sm text-danger" *temPerfil="permissoes.editarOkrs" (click)="desassociar.emit(okr.id)">
                      Remover
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="empty-state">{{ vazio() }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class OkrAssociacoes implements OnInit {
  private readonly okrsService = inject(OkrsService);
  private readonly toast = inject(ToastService);

  readonly titulo = input('OKRs');
  readonly vazio = input('Nenhum OKR associado.');
  readonly associados = input<OkrResumo[]>([]);
  readonly editavel = input(true);
  readonly associar$ = output<string>({ alias: 'associar' });
  readonly desassociar = output<string>();

  readonly permissoes = PERMISSOES;
  readonly num = num;
  readonly todos = signal<Okr[]>([]);
  readonly selecionado = signal('');
  readonly disponiveis = computed(() => {
    const ids = new Set(this.associados().map((o) => o.id));
    return this.todos().filter((o) => !ids.has(o.id));
  });

  ngOnInit(): void {
    this.okrsService.listar().subscribe({
      next: (lista) => this.todos.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  associar(): void {
    const id = this.selecionado();
    if (id) {
      this.associar$.emit(id);
      this.selecionado.set('');
    }
  }
}
