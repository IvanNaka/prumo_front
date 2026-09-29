import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { TemPerfilDirective } from './tem-perfil.directive';

@Component({
  imports: [TemPerfilDirective],
  template: `
    <button id="po" *temPerfil="['ProductOwner']">Editar</button>
    <button id="tl" *temPerfil="['TechLead']">Dependência</button>
  `,
})
class Host {}

function login(perfis: string[]): void {
  sessionStorage.setItem('prumo_token', 'jwt');
  sessionStorage.setItem('prumo_expira_em', new Date(Date.now() + 3600_000).toISOString());
  sessionStorage.setItem('prumo_usuario', JSON.stringify({ id: '1', nome: 'x', email: 'x', perfis }));
}

describe('TemPerfilDirective', () => {
  beforeEach(() => sessionStorage.clear());

  it('mostra o botão só para quem tem o perfil', () => {
    login(['ProductOwner']);
    TestBed.configureTestingModule({ imports: [Host], providers: [provideHttpClient()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#po')).not.toBeNull();
    expect(el.querySelector('#tl')).toBeNull();
  });

  it('Administrador vê todos os botões', () => {
    login(['Administrador']);
    TestBed.configureTestingModule({ imports: [Host], providers: [provideHttpClient()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#po')).not.toBeNull();
    expect(el.querySelector('#tl')).not.toBeNull();
  });
});
