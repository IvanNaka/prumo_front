import { ACOES_POR_STATUS, projetoEhFinal } from './projeto';

describe('ações do projeto por status (Figura 26 + Cancelar)', () => {
  it('só permite ações válidas', () => {
    expect(ACOES_POR_STATUS.Rascunho).toEqual(['Aprovar', 'Cancelar']);
    expect(ACOES_POR_STATUS.EmAndamento).toContain('Finalizar');
    expect(ACOES_POR_STATUS.Concluido).toEqual(['Arquivar']);
    expect(ACOES_POR_STATUS.Cancelado).toEqual([]);
  });

  it('Cancelado e Arquivado são finais', () => {
    expect(projetoEhFinal('Cancelado')).toBe(true);
    expect(projetoEhFinal('Arquivado')).toBe(true);
    expect(projetoEhFinal('EmRisco')).toBe(false);
  });
});
