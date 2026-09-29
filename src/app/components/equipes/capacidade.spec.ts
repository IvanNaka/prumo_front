import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CapacidadeEquipe } from './capacidade';

describe('CapacidadeEquipe (T15)', () => {
  it('mostra 125% e "Sobrecarregada" com capacidade 160 h e demanda 200 h', () => {
    TestBed.configureTestingModule({
      imports: [CapacidadeEquipe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'e1' })) } },
      ],
    });
    const fixture = TestBed.createComponent(CapacidadeEquipe);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((r) => r.url.endsWith('/equipes/e1/capacidade')).flush({
      disponivel: true,
      mes: '2026-06',
      equipeNome: 'Squad',
      capacidade: 160,
      demanda: 200,
      ocupacao: 125,
      horasMes: 80,
      utilizacao: 50,
      classificacao: 'Sobrecarregada',
      membros: [],
    });
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('125%');
    expect(texto).toContain('Sobrecarregada');
  });
});
