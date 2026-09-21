import { peticionApi } from './api';

export interface EstadoGoogle {
  conectado: boolean;
  ultimaSincronizacion: string | null;
}

export interface ResumenSincronizacionGoogle {
  creados: number;
  actualizados: number;
  eliminados: number;
  importados: number;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function obtenerUrlConexionGoogle(token: string) {
  return peticionApi<{ url: string }>('/google/conectar', { headers: cabeceras(token) });
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
