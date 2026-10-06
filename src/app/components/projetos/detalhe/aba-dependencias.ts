import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_PROJETO_STATUS } from '../../../core/models/rotulos';
import { Dependencia, DependenciasService } from '../../../core/services/dependencias.service';
import { ToastService } from '../../../core/services/toast.service';
import { badgeProjeto } from '../../../shared/cores';
import { NovaDependencia } from '../../../shared/nova-dependencia';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** Aba "Dependências" do projeto (UC12): "Este projeto depende de" e "Projetos que dependem deste". */
@Component({
  selector: 'app-aba-dependencias',
  imports: [RouterLink, TemPerfilDirective, NovaDependencia],
  template: `
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Este projeto depende de</h2>
          @if (editavel()) {
            <button type="button" class="btn btn-primary btn-sm" *temPerfil="permissoes.editarDependencias" (click)="formAberto.set(true)">Adicionar</button>
          }
        </div>
        <div class="table-wrap">
          <table class="table">
            <tbody>
              @for (d of dependeDe(); track d.id) {
                <tr>
                  <td>
                    <a class="strong" [routerLink]="['/projetos', d.projetoDestinoId]">{{ d.projetoDestinoNome }}</a>
                    <div><span [class]="badgeProjeto(d.projetoDestinoStatus)">{{ rotuloStatus[d.projetoDestinoStatus] }}</span></div>
                  </td>
                  <td>
                    @if (d.emRisco) {
                      <span class="badge badge-red" [title]="d.motivo">Em risco</span>
                    }
                  </td>
                  <td class="actions">
                    @if (editavel()) {
                      <button type="button" class="btn btn-link btn-sm text-danger" *temPerfil="permissoes.editarDependencias" (click)="excluir(d)">Remover</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="empty-state">Nenhuma dependência.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">Projetos que dependem deste</h2>
        <div class="table-wrap">
          <table class="table">
            <tbody>
              @for (d of dependentes(); track d.id) {
                <tr>
                  <td>
                    <a class="strong" [routerLink]="['/projetos', d.projetoOrigemId]">{{ d.projetoOrigemNome }}</a>
                    <div><span [class]="badgeProjeto(d.projetoOrigemStatus)">{{ rotuloStatus[d.projetoOrigemStatus] }}</span></div>
                  </td>
                  <td>
                    @if (d.emRisco) {
                      <span class="badge badge-red" [title]="d.motivo">Em risco</span>
                    }
                  </td>
                  <td class="actions">
                    @if (editavel()) {
                      <button type="button" class="btn btn-link btn-sm text-danger" *temPerfil="permissoes.editarDependencias" (click)="excluir(d)">Remover</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="empty-state">Nenhum projeto depende deste.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (formAberto()) {
      <app-nova-dependencia [portfolioId]="portfolioId()" [origemId]="projetoId()" (salvo)="salvo()" (fechar)="formAberto.set(false)"></app-nova-dependencia>
    }
  `,
})
export class AbaDependencias {
  private readonly service = inject(DependenciasService);
  private readonly toast = inject(ToastService);

  readonly projetoId = input.required<string>();
  readonly portfolioId = input.required<string>();
  readonly dependencias = input<Dependencia[]>([]);
  readonly editavel = input(true);
  readonly alterado = output<void>();

  readonly permissoes = PERMISSOES;
  readonly rotuloStatus = ROTULO_PROJETO_STATUS;
  readonly badgeProjeto = badgeProjeto;
  readonly formAberto = signal(false);

  readonly dependeDe = computed(() => this.dependencias().filter((d) => d.projetoOrigemId === this.projetoId()));
  readonly dependentes = computed(() => this.dependencias().filter((d) => d.projetoDestinoId === this.projetoId()));

  salvo(): void {
    this.formAberto.set(false);
    this.alterado.emit();
  }

  excluir(d: Dependencia): void {
    this.service.excluir(d.id).subscribe({
      next: () => {
        this.toast.sucesso('Dependência removida.');
        this.alterado.emit();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
