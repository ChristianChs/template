export interface LoginPayload {
  usuario: string;
  password: string;
}

export interface SessionUser {
  nombre: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}
