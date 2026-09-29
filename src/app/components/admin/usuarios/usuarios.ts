import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Role, ROLES } from '../../../core/models/enums';
import { mensagemDeErro } from '../../../core/models/problem';
import { ROTULO_ROLE } from '../../../core/models/rotulos';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario, UsuariosService } from '../../../core/services/usuarios.service';

/** RF03 — cadastro, edição, ativação e desativação de usuários (somente Administrador). */
@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
})
export class Usuarios {
  private readonly service = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly roles = ROLES;
  readonly rotuloRole = ROTULO_ROLE;

  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly editando = signal<Usuario | null>(null);
  readonly formAberto = signal(false);
  readonly salvando = signal(false);
  readonly filtro = signal('');

  readonly filtrados = computed(() => {
    const termo = this.filtro().trim().toLowerCase();
    return this.usuarios().filter(
      (u) => !termo || u.nome.toLowerCase().includes(termo) || u.email.includes(termo)
    );
  });

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    perfis: this.fb.nonNullable.control<Role[]>([], [Validators.required]),
  });

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemDeErro(e, 'Não foi possível carregar os usuários.'));
      },
    });
  }

  novo(): void {
    this.editando.set(null);
    this.form.reset({ nome: '', email: '', perfis: [] });
    this.form.controls.email.enable();
    this.formAberto.set(true);
  }

  editar(usuario: Usuario): void {
    this.editando.set(usuario);
    this.form.reset({ nome: usuario.nome, email: usuario.email, perfis: [...usuario.perfis] });
    this.form.controls.email.disable();
    this.formAberto.set(true);
  }

  fechar(): void {
    this.formAberto.set(false);
  }

  temPerfilSelecionado(role: Role): boolean {
    return this.form.controls.perfis.value.includes(role);
  }

  alternarPerfil(role: Role, marcado: boolean): void {
    const atuais = this.form.controls.perfis.value;
    this.form.controls.perfis.setValue(marcado ? [...atuais, role] : atuais.filter((r) => r !== role));
    this.form.controls.perfis.markAsTouched();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = this.form.getRawValue();
    const editando = this.editando();
    const req = editando ? this.service.editar(editando.id, dados) : this.service.criar(dados);
    this.salvando.set(true);
    req.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(editando ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemDeErro(e));
      },
    });
  }

  alternarAtivo(usuario: Usuario): void {
    this.service.definirAtivo(usuario.id, !usuario.ativo).subscribe({
      next: () => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === usuario.id ? { ...u, ativo: !usuario.ativo } : u))
        );
        this.toast.sucesso(usuario.ativo ? 'Usuário desativado.' : 'Usuário ativado.');
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }

  ehEuMesmo(usuario: Usuario): boolean {
    return usuario.id === this.auth.getUserId();
  }
}
