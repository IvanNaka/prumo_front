import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PERMISSOES } from '../../core/models/permissoes';
import { mensagemDeErro } from '../../core/models/problem';
import { KeyResult, Okr, OkrsService } from '../../core/services/okrs.service';
import { ToastService } from '../../core/services/toast.service';
import { data, num } from '../../shared/cores';
import { TemPerfilDirective } from '../../shared/tem-perfil.directive';

/** UC8 / RF14, RF15, RF17 — OKRs, Key Results e progresso (F4). */
@Component({
  selector: 'app-okrs',
  imports: [ReactiveFormsModule, TemPerfilDirective],
  templateUrl: './okrs.html',
  styleUrl: './okrs.css',
})
export class Okrs {
  private readonly service = inject(OkrsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly permissoes = PERMISSOES;
  readonly num = num;
  readonly data = data;

  readonly okrs = signal<Okr[]>([]);
  readonly carregando = signal(true);
  readonly expandidos = signal<Set<string>>(new Set());
  readonly formAberto = signal(false);
  readonly editando = signal<Okr | null>(null);
  readonly salvando = signal(false);
  readonly krEmEdicao = signal<string | null>(null);
  readonly novoValor = signal<number>(0);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descricao: ['', [Validators.maxLength(1000)]],
    dataInicio: [''],
    dataFim: [''],
    keyResults: this.fb.array([this.novoKr()], { validators: [Validators.required, Validators.minLength(1)] }),
  });

  get krs(): FormArray {
    return this.form.controls.keyResults as FormArray;
  }

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.okrs.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  alternar(okr: Okr): void {
    this.expandidos.update((set) => {
      const novo = new Set(set);
      if (novo.has(okr.id)) {
        novo.delete(okr.id);
      } else {
        novo.add(okr.id);
      }
      return novo;
    });
  }

  novoKr(kr?: KeyResult) {
    return this.fb.nonNullable.group({
      id: [kr?.id ?? ''],
      descricao: [kr?.descricao ?? '', [Validators.required, Validators.maxLength(300)]],
      meta: [kr?.meta ?? 1, [Validators.required, Validators.min(0.01)]],
      valorAtual: [kr?.valorAtual ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  abrirNovo(): void {
    this.editando.set(null);
    this.form.reset({ titulo: '', descricao: '', dataInicio: '', dataFim: '' });
    this.krs.clear();
    this.krs.push(this.novoKr()); // começa com 1 linha
    this.formAberto.set(true);
  }

  abrirEdicao(okr: Okr): void {
    this.editando.set(okr);
    this.form.reset({
      titulo: okr.titulo,
      descricao: okr.descricao ?? '',
      dataInicio: okr.dataInicio ?? '',
      dataFim: okr.dataFim ?? '',
    });
    this.krs.clear();
    okr.keyResults.forEach((kr) => this.krs.push(this.novoKr(kr)));
    this.formAberto.set(true);
  }

  adicionarKr(): void {
    this.krs.push(this.novoKr());
  }

  removerKr(indice: number): void {
    this.krs.removeAt(indice);
  }

  salvar(): void {
    if (this.form.invalid || this.krs.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const dados = {
      titulo: valores.titulo,
      descricao: valores.descricao || null,
      dataInicio: valores.dataInicio || null,
      dataFim: valores.dataFim || null,
      keyResults: (valores.keyResults as { id: string; descricao: string; meta: number; valorAtual: number }[]).map((kr) => ({
        ...kr,
        id: kr.id || null,
      })),
    };
    const editando = this.editando();
    const req = editando ? this.service.editar(editando.id, dados) : this.service.criar(dados);
    this.salvando.set(true);
    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(editando ? 'OKR atualizado com sucesso.' : 'OKR cadastrado com sucesso.');
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e)); // RN13
      },
    });
  }

  editarValor(kr: KeyResult): void {
    this.krEmEdicao.set(kr.id);
    this.novoValor.set(kr.valorAtual);
  }

  salvarValor(kr: KeyResult): void {
    this.service.atualizarValor(kr.id, this.novoValor()).subscribe({
      next: () => {
        this.krEmEdicao.set(null);
        this.toast.sucesso('Valor atualizado.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  cor(progresso: number): string {
    return progresso >= 70 ? 'green' : progresso >= 40 ? 'yellow' : 'red';
  }
}
