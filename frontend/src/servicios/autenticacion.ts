import { peticionApi } from './api';

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string | null;
}

export interface RespuestaAutenticacion {
  tokenAcceso: string;
  usuario: UsuarioSesion;
}

export function registrarUsuario(datos: {
  correo: string;
  contrasena: string;
  nombre?: string;
}) {
  return peticionApi<RespuestaAutenticacion>('/autenticacion/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function iniciarSesion(datos: { correo: string; contrasena: string }) {
  return peticionApi<RespuestaAutenticacion>('/autenticacion/login', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function obtenerPerfil(tokenAcceso: string) {
  return peticionApi<UsuarioSesion>('/autenticacion/perfil', {
    headers: { Authorization: `Bearer ${tokenAcceso}` },
  });
}
