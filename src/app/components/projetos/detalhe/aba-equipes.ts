import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { EquipeAlocada } from '../../../core/models/projeto';
import { Equipe, EquipesService } from '../../../core/services/equipes.service';
import { ProjetosService } from '../../../core/services/projetos.service';
import { ToastService } from '../../../core/services/toast.service';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** Aba "Equipes" do projeto: equipes alocadas e o botão "Alocar equipe". */
@Component({
  selector: 'app-aba-equipes',
  imports: [RouterLink, TemPerfilDirective],
  template: `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Equipes alocadas</h2>
        @if (editavel()) {
          <div class="row" *temPerfil="permissoes.editarProjetos">
            <select class="input" style="min-width: 240px" [value]="selecionada()" (change)="selecionada.set($any($event.target).value)">
              <option value="">Selecione uma equipe</option>
              @for (e of disponiveis(); track e.id) {
                <option [value]="e.id">{{ e.nome }}</option>
              }
            </select>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="!selecionada()" (click)="alocar()">Alocar equipe</button>
          </div>
        }
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Equipe</th><th>Membros</th><th>Capacidade mensal</th><th class="actions"></th></tr>
          </thead>
          <tbody>
            @for (e of alocadas(); track e.id) {
              <tr>
                <td><a class="strong" [routerLink]="['/equipes', e.id, 'capacidade']">{{ e.nome }}</a></td>
                <td>{{ e.quantidadeMembros }}</td>
                <td>{{ e.capacidadeMensalTotal }} h</td>
                <td class="actions">
                  @if (editavel()) {
                    <button type="button" class="btn btn-link btn-sm text-danger" *temPerfil="permissoes.editarProjetos" (click)="desalocar(e.id)">
                      Remover
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty-state">Nenhuma equipe alocada ao projeto.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AbaEquipes implements OnInit {
  private readonly equipesService = inject(EquipesService);
  private readonly projetosService = inject(ProjetosService);
  private readonly toast = inject(ToastService);

  readonly projetoId = input.required<string>();
  readonly alocadas = input<EquipeAlocada[]>([]);
  readonly editavel = input(true);
  readonly alterado = output<void>();

  readonly permissoes = PERMISSOES;
  readonly todas = signal<Equipe[]>([]);
  readonly selecionada = signal('');
  readonly disponiveis = computed(() => {
    const ids = new Set(this.alocadas().map((e) => e.id));
    return this.todas().filter((e) => !ids.has(e.id));
  });

  ngOnInit(): void {
    this.equipesService.listar().subscribe({
      next: (lista) => this.todas.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  alocar(): void {
    const equipeId = this.selecionada();
    if (!equipeId) {
      return;
    }
    this.projetosService.alocarEquipe(this.projetoId(), equipeId).subscribe({
      next: () => {
        this.selecionada.set('');
        this.toast.sucesso('Equipe alocada ao projeto.');
        this.alterado.emit();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  desalocar(equipeId: string): void {
    this.projetosService.desalocarEquipe(this.projetoId(), equipeId).subscribe({
      next: () => {
        this.toast.sucesso('Equipe removida do projeto.');
        this.alterado.emit();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
