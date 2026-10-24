export type UserRole = 'Administrador' | 'Monitor';

export interface User {
  id: number;
  nombre: string;
  username: string;
  telefono?: string;
  rol: UserRole;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface LoginResponse {
  id: number;
  nombre: string;
  username: string;
  telefono?: string;
  rol: UserRole;
  activo?: boolean;
}
