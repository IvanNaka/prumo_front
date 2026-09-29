import { ACOES_POR_STATUS_PORTFOLIO } from './portfolio';

describe('ações do portfólio por status (Figura 27)', () => {
  it('Priorizado permite aprovar', () => {
    expect(ACOES_POR_STATUS_PORTFOLIO.Priorizado).toEqual(['aprovar']);
  });

  it('Monitoramento permite reavaliar e encerrar', () => {
    expect(ACOES_POR_STATUS_PORTFOLIO.Monitoramento).toEqual(['reavaliar', 'encerrar']);
  });

  it('Encerrado não tem ações', () => {
    expect(ACOES_POR_STATUS_PORTFOLIO.Encerrado).toEqual([]);
  });
});
