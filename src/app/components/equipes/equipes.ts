import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PERMISSOES } from '../../core/models/permissoes';
import { Portfolio } from '../../core/models/portfolio';
import { mensagemDeErro } from '../../core/models/problem';
import { Equipe, EquipesService, MembroEquipe } from '../../core/services/equipes.service';
import { PortfoliosService } from '../../core/services/portfolios.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioOpcao, UsuariosService } from '../../core/services/usuarios.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { brl } from '../../shared/cores';
import { TemPerfilDirective } from '../../shared/tem-perfil.directive';

/** RF29–RF31 — equipes e membros (custo/hora e capacidade mensal). */
@Component({
  selector: 'app-equipes',
  imports: [ReactiveFormsModule, RouterLink, TemPerfilDirective, ConfirmDialog],
  templateUrl: './equipes.html',
  styles: ['.invite-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.1em; }'],
})
export class Equipes {
  private readonly service = inject(EquipesService);
  private readonly portfoliosService = inject(PortfoliosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly permissoes = PERMISSOES;
  readonly brl = brl;

  readonly equipes = signal<Equipe[]>([]);
  readonly portfolios = signal<Portfolio[]>([]);
  readonly usuarios = signal<UsuarioOpcao[]>([]);
  readonly carregando = signal(true);
  readonly equipeEmEdicao = signal<Equipe | null>(null);
  readonly formEquipeAberto = signal(false);
  readonly membroContexto = signal<{ equipe: Equipe; membro: MembroEquipe | null } | null>(null);
  readonly excluindo = signal<Equipe | null>(null);

  readonly formEquipe = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    portfolioId: [''],
  });

  readonly formMembro = this.fb.nonNullable.group({
    usuarioId: [''],
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    custoHora: [0, [Validators.required, Validators.min(0)]],
    capacidadeMensalHoras: [160, [Validators.required, Validators.min(1), Validators.max(300)]],
  });

  constructor() {
    this.carregar();
    this.portfoliosService.listar().subscribe({ next: (lista) => this.portfolios.set(lista) });
    this.usuariosService.ativos().subscribe({ next: (lista) => this.usuarios.set(lista) });
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.equipes.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  novaEquipe(): void {
    this.equipeEmEdicao.set(null);
    this.formEquipe.reset({ nome: '', portfolioId: '' });
    this.formEquipeAberto.set(true);
  }

  editarEquipe(equipe: Equipe): void {
    this.equipeEmEdicao.set(equipe);
    this.formEquipe.reset({ nome: equipe.nome, portfolioId: equipe.portfolioId ?? '' });
    this.formEquipeAberto.set(true);
  }

  salvarEquipe(): void {
    if (this.formEquipe.invalid) {
      this.formEquipe.markAllAsTouched();
      return;
    }
    const valores = this.formEquipe.getRawValue();
    const dados = { nome: valores.nome, portfolioId: valores.portfolioId || null };
    const atual = this.equipeEmEdicao();
    (atual ? this.service.editar(atual.id, dados) : this.service.criar(dados)).subscribe({
      next: () => {
        this.formEquipeAberto.set(false);
        this.toast.sucesso(atual ? 'Equipe atualizada.' : 'Equipe cadastrada.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  confirmarExclusao(): void {
    const equipe = this.excluindo();
    this.excluindo.set(null);
    if (!equipe) return;
    this.service.excluir(equipe.id).subscribe({
      next: () => {
        this.toast.sucesso('Equipe excluída.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  /** Quem entra com o código vira Desenvolvedor e membro da equipe. */
  copiarCodigo(equipe: Equipe): void {
    if (!equipe.codigoConvite) return;
    navigator.clipboard?.writeText(equipe.codigoConvite).then(
      () => this.toast.sucesso('Código de convite copiado.'),
      () => this.toast.erro('Não foi possível copiar o código.')
    );
  }

  gerarNovoCodigo(equipe: Equipe): void {
    this.service.gerarCodigoConvite(equipe.id).subscribe({
      next: (atualizada) => {
        this.equipes.update((lista) => lista.map((e) => (e.id === atualizada.id ? atualizada : e)));
        this.toast.sucesso('Novo código gerado. O código anterior deixou de valer.');
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  novoMembro(equipe: Equipe): void {
    this.formMembro.reset({ usuarioId: '', nome: '', email: '', custoHora: 0, capacidadeMensalHoras: 160 });
    this.membroContexto.set({ equipe, membro: null });
  }

  editarMembro(equipe: Equipe, membro: MembroEquipe): void {
    this.formMembro.reset({
      usuarioId: membro.usuarioId ?? '',
      nome: membro.nome,
      email: membro.email,
      custoHora: membro.custoHora,
      capacidadeMensalHoras: membro.capacidadeMensalHoras,
    });
    this.membroContexto.set({ equipe, membro });
  }

  /** Ao escolher um usuário do sistema, preenche nome e e-mail. */
  escolherUsuario(id: string): void {
    const usuario = this.usuarios().find((u) => u.id === id);
    if (usuario) {
      this.formMembro.patchValue({ nome: usuario.nome, email: usuario.email });
    }
  }

  salvarMembro(): void {
    const contexto = this.membroContexto();
    if (!contexto || this.formMembro.invalid) {
      this.formMembro.markAllAsTouched();
      return;
    }
    const valores = this.formMembro.getRawValue();
    const dados = { ...valores, usuarioId: valores.usuarioId || null };
    const req = contexto.membro
      ? this.service.editarMembro(contexto.equipe.id, contexto.membro.id, dados)
      : this.service.adicionarMembro(contexto.equipe.id, dados);
    req.subscribe({
      next: () => {
        this.membroContexto.set(null);
        this.toast.sucesso('Membro salvo.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  removerMembro(equipe: Equipe, membro: MembroEquipe): void {
    this.service.removerMembro(equipe.id, membro.id).subscribe({
      next: () => {
        this.toast.sucesso('Membro removido.');
        this.carregar();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
