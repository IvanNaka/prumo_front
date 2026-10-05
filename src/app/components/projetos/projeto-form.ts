import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { CATEGORIAS, CategoriaEstrategica, Prioridade, PRIORIDADES } from '../../core/models/enums';
import { VALOR_MONETARIO_MAXIMO } from '../../core/models/limites';
import { mensagemDeErro } from '../../core/models/problem';
import { ProjetoDetalhe, SalvarProjeto } from '../../core/models/projeto';
import { DESCRICAO_CATEGORIA, ROTULO_PRIORIDADE } from '../../core/models/rotulos';
import { ProjetosService } from '../../core/services/projetos.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioOpcao, UsuariosService } from '../../core/services/usuarios.service';

/** Validador "fim ≥ início" (RN12). */
function fimDepoisDoInicio(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('dataInicio')?.value as string;
  const fim = group.get('dataFim')?.value as string;
  return inicio && fim && fim < inicio ? { fimAntesDoInicio: true } : null;
}

/** UC7 — formulário de projeto (cadastro e edição). */
@Component({
  selector: 'app-projeto-form',
  imports: [ReactiveFormsModule],
  templateUrl: './projeto-form.html',
})
export class ProjetoForm implements OnInit {
  private readonly service = inject(ProjetosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly portfolioId = input.required<string>();
  /** Projeto em edição; vazio = novo. */
  readonly projeto = input<ProjetoDetalhe | null>(null);
  readonly salvo = output<ProjetoDetalhe>();
  readonly fechar = output<void>();

  readonly categorias = CATEGORIAS;
  readonly descricaoCategoria = DESCRICAO_CATEGORIA;
  readonly prioridades = PRIORIDADES;
  readonly rotuloPrioridade = ROTULO_PRIORIDADE;
  readonly usuarios = signal<UsuarioOpcao[]>([]);
  readonly salvando = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      descricao: ['', [Validators.maxLength(2000)]],
      responsavelId: ['', [Validators.required]],
      dataInicio: ['', [Validators.required]],
      dataFim: ['', [Validators.required]],
      orcamentoAprovado: [0, [Validators.required, Validators.min(0), Validators.max(VALOR_MONETARIO_MAXIMO)]],
      categoriaEstrategica: ['' as CategoriaEstrategica | '', [Validators.required]],
      prioridade: ['Media' as Prioridade, [Validators.required]],
      jiraProjectKey: ['', [Validators.maxLength(50)]],
    },
    { validators: fimDepoisDoInicio }
  );

  ngOnInit(): void {
    const atual = this.projeto();
    if (atual) {
      this.form.reset({
        nome: atual.nome,
        descricao: atual.descricao ?? '',
        responsavelId: atual.responsavelId,
        dataInicio: atual.dataInicio,
        dataFim: atual.dataFim,
        orcamentoAprovado: atual.orcamentoAprovado,
        categoriaEstrategica: atual.categoriaEstrategica,
        prioridade: atual.prioridade,
        jiraProjectKey: atual.jiraProjectKey ?? '',
      });
    }
    this.usuariosService.ativos().subscribe({
      next: (lista) => this.usuarios.set(lista),
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const dados: SalvarProjeto = {
      ...valores,
      categoriaEstrategica: valores.categoriaEstrategica as CategoriaEstrategica,
      jiraProjectKey: valores.jiraProjectKey || null,
    };
    const atual = this.projeto();
    const req = atual ? this.service.editar(atual.id, dados) : this.service.criar(this.portfolioId(), dados);
    this.salvando.set(true);
    req.subscribe({
      next: (projeto) => {
        this.salvando.set(false);
        this.toast.sucesso(atual ? 'Projeto atualizado com sucesso.' : 'Projeto cadastrado com sucesso.');
        this.salvo.emit(projeto);
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e)); // RN04, RN12, RN22, RN23
      },
    });
  }
}
