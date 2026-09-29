import { Role } from './enums';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  perfis: Role[];
}

export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: UsuarioSessao;
}
