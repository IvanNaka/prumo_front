import { ROLES, PROJETO_STATUS } from './enums';
import { ROTULO_PROJETO_STATUS, ROTULO_ROLE } from './rotulos';

describe('enums e rótulos', () => {
  it('possui os 7 perfis (D02)', () => {
    expect(ROLES.length).toBe(7);
    expect(ROLES).toContain('Administrador');
  });

  it('tem rótulo para todo status de projeto', () => {
    for (const status of PROJETO_STATUS) {
      expect(ROTULO_PROJETO_STATUS[status]).toBeTruthy();
    }
    expect(ROTULO_PROJETO_STATUS.EmAndamento).toBe('Em andamento');
    expect(ROTULO_ROLE.ProductOwner).toBe('Product Owner');
  });
});
