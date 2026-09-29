import { peticionApi } from './api';

export interface EstadoGoogle {
  conectado: boolean;
  ultimaSincronizacion: string | null;
  // Si Google ha concedido también los permisos de Classroom.
  classroom: boolean;
}

export interface ResumenClassroom {
  cursos: number;
  nuevas: number;
  actualizadas: number;
}

export interface ResumenSincronizacionGoogle {
  creados: number;
  actualizados: number;
  eliminados: number;
  importados: number;
  errores: number;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Con classroom, la URL pide además los permisos (solo lectura) de Classroom.
export function obtenerUrlConexionGoogle(token: string, classroom = false) {
  return peticionApi<{ url: string }>(`/google/conectar${classroom ? '?classroom=1' : ''}`, {
    headers: cabeceras(token),
  });
}

export function importarClassroom(token: string) {
  return peticionApi<ResumenClassroom>('/google/classroom/importar', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function obtenerEstadoGoogle(token: string) {
  return peticionApi<EstadoGoogle>('/google/estado', { headers: cabeceras(token) });
}

export function sincronizarGoogle(token: string) {
  return peticionApi<ResumenSincronizacionGoogle>('/google/sincronizar', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function desconectarGoogle(token: string) {
  return peticionApi<void>('/google/desconectar', {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
