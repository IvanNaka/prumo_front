import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RN18, Vpl } from '../../../core/models/indicadores';
import { PERMISSOES } from '../../../core/models/permissoes';
import { mensagemDeErro } from '../../../core/models/problem';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceiroService, Retorno } from '../../../core/services/financeiro.service';
import { ToastService } from '../../../core/services/toast.service';
import { brl, data, num } from '../../../shared/cores';
import { TemPerfilDirective } from '../../../shared/tem-perfil.directive';

/** Aba "Business case" (RF25, RF41, F6): investimento, taxa, fluxos previstos, retornos e VPL. */
@Component({
  selector: 'app-aba-business-case',
  imports: [ReactiveFormsModule, TemPerfilDirective],
  templateUrl: './aba-business-case.html',
})
export class AbaBusinessCase implements OnInit {
  private readonly service = inject(FinanceiroService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly projetoId = input.required<string>();
  readonly editavel = input(true);

  readonly permissoes = PERMISSOES;
  readonly rn18 = RN18;
  readonly brl = brl;
  readonly num = num;
  readonly data = data;
  readonly hoje = new Date().toISOString().slice(0, 10);

  readonly vpl = signal<Vpl | null>(null);
  readonly retornos = signal<Retorno[]>([]);
  readonly salvando = signal(false);
  readonly retornoAberto = signal(false);

  readonly form = this.fb.nonNullable.group({
    investimentoInicial: [0, [Validators.required, Validators.min(0)]],
    taxaDescontoAnual: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    fluxosPrevistos: this.fb.array<ReturnType<AbaBusinessCase['novoFluxo']>>([]),
  });

  readonly formRetorno = this.fb.nonNullable.group({
    data: [this.hoje, [Validators.required]],
    valor: [0, [Validators.required]],
    descricao: ['', [Validators.maxLength(300)]],
  });

  get fluxos(): FormArray {
    return this.form.controls.fluxosPrevistos as FormArray;
  }

  podeEditar(): boolean {
    return this.editavel() && this.auth.temPerfil(PERMISSOES.editarFinanceiro);
  }

  novoFluxo(mes = 1, valor = 0) {
    return this.fb.nonNullable.group({
      mes: [mes, [Validators.required, Validators.min(1)]],
      valor: [valor, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.carregar();
    if (!this.podeEditar()) {
      this.form.disable();
    }
  }

  carregar(): void {
    const id = this.projetoId();
    this.service.businessCase(id).subscribe({
      next: (bc) => {
        this.form.patchValue({ investimentoInicial: bc.investimentoInicial, taxaDescontoAnual: bc.taxaDescontoAnual });
        this.fluxos.clear();
        bc.fluxosPrevistos.forEach((f) => this.fluxos.push(this.novoFluxo(f.mes, f.valor)));
        if (!this.podeEditar()) {
          this.form.disable();
        }
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.service.retornos(id).subscribe({
      next: (lista) => this.retornos.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
    this.service.indicadoresProjeto(id).subscribe({
      next: (i) => this.vpl.set(i.vpl),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  adicionarFluxo(): void {
    const proximo = this.fluxos.length === 0 ? 1 : Math.max(...this.fluxos.getRawValue().map((f: { mes: number }) => f.mes)) + 1;
    this.fluxos.push(this.novoFluxo(proximo, 0));
  }

  removerFluxo(indice: number): void {
    this.fluxos.removeAt(indice);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.service.salvarBusinessCase(this.projetoId(), this.form.getRawValue()).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Business case salvo.');
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  salvarRetorno(): void {
    if (this.formRetorno.invalid) {
      this.formRetorno.markAllAsTouched();
      return;
    }
    const valores = this.formRetorno.getRawValue();
    this.service.criarRetorno(this.projetoId(), { ...valores, descricao: valores.descricao || null }).subscribe({
      next: () => {
        this.retornoAberto.set(false);
        this.formRetorno.reset({ data: this.hoje, valor: 0, descricao: '' });
        this.toast.sucesso('Retorno registrado.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
