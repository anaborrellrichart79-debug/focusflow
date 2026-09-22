import { peticionApi } from './api';

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string | null;
  consentimientoConfirmado: boolean;
  modoEscolarActivo: boolean;
}

export interface RespuestaAutenticacion {
  tokenAcceso: string;
  usuario: UsuarioSesion;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function registrarUsuario(datos: {
  correo: string;
  contrasena: string;
  nombre?: string;
  fechaNacimiento: string;
  correoTutor?: string;
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
    headers: cabeceras(tokenAcceso),
  });
}

export function confirmarConsentimiento(token: string) {
  return peticionApi<void>('/autenticacion/confirmar-consentimiento', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function reenviarConfirmacion(tokenAcceso: string) {
  return peticionApi<void>('/autenticacion/reenviar-confirmacion', {
    method: 'POST',
    headers: cabeceras(tokenAcceso),
  });
}

export function actualizarPreferencias(tokenAcceso: string, datos: { modoEscolarActivo: boolean }) {
  return peticionApi<UsuarioSesion>('/autenticacion/preferencias', {
    method: 'PATCH',
    headers: cabeceras(tokenAcceso),
    body: JSON.stringify(datos),
  });
}
