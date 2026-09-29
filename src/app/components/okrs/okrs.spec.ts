import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Okrs } from './okrs';

describe('Okrs (UC8)', () => {
  it('formulário começa com 1 KR e bloqueia salvar sem KR válido (RN13)', () => {
    TestBed.configureTestingModule({ imports: [Okrs], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const component = TestBed.createComponent(Okrs).componentInstance;

    component.abrirNovo();
    expect(component.krs.length).toBe(1);

    component.form.patchValue({ titulo: 'Objetivo' });
    expect(component.form.invalid).toBe(true); // KR sem descrição

    component.krs.at(0).patchValue({ descricao: 'KR 1', meta: 10, valorAtual: 0 });
    expect(component.form.valid).toBe(true);

    component.krs.clear();
    expect(component.form.invalid).toBe(true);
  });
});
