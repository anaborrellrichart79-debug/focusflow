import type { CodigoIdioma } from '@/idiomas';
import type { ConfigPomodoro } from '@/utilidades/pomodoro';
import { peticionApi } from './api';

export type PerfilUsuario = 'ESTUDIANTE' | 'PROFESIONAL' | 'PADRE';

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string | null;
  consentimientoConfirmado: boolean;
  // false en una cuenta recién creada hasta que se pulsa el enlace del correo.
  // Opcional por lo mismo que perfiles: undefined cuenta como verificado.
  correoVerificado?: boolean;
  modoEscolarActivo: boolean;
  // Perfiles elegidos en Ajustes; vacío = el Inicio usa los sugeridos.
  // Opcional en el tipo para no obligar a cada dato de prueba a incluirlo.
  perfiles?: PerfilUsuario[];
  // Idioma guardado en el servidor para lo que redacta él (push, correos, IA).
  idioma?: CodigoIdioma;
  // false en una cuenta recién creada: se le enseña el asistente de bienvenida.
  bienvenidaCompletada?: boolean;
  // Para proponer el Pomodoro que toca por edad (null si no se sabe).
  edad?: number | null;
  // Pomodoro ajustado por la cuenta; null = el de su edad.
  pomodoro?: ConfigPomodoro | null;
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
  idioma?: CodigoIdioma;
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

export function verificarCorreo(token: string) {
  return peticionApi<void>('/autenticacion/verificar-correo', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function reenviarVerificacion(tokenAcceso: string) {
  return peticionApi<void>('/autenticacion/reenviar-verificacion', {
    method: 'POST',
    headers: cabeceras(tokenAcceso),
  });
}

export function actualizarPreferencias(
  tokenAcceso: string,
  datos: {
    modoEscolarActivo?: boolean;
    perfiles?: PerfilUsuario[];
    idioma?: CodigoIdioma;
    bienvenidaCompletada?: true;
    pomodoro?: ConfigPomodoro | null;
  },
) {
  return peticionApi<UsuarioSesion>('/autenticacion/preferencias', {
    method: 'PATCH',
    headers: cabeceras(tokenAcceso),
    body: JSON.stringify(datos),
  });
}

// Borra la cuenta y todos sus datos (hay que repetir la contraseña).
export function eliminarCuenta(tokenAcceso: string, contrasena: string) {
  return peticionApi<void>('/autenticacion/cuenta', {
    method: 'DELETE',
    headers: cabeceras(tokenAcceso),
    body: JSON.stringify({ contrasena }),
  });
}
