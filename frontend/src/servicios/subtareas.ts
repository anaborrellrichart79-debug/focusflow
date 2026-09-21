import { peticionApi } from './api';

export interface Subtarea {
  id: string;
  titulo: string;
  completada: boolean;
  tareaId: string;
  creadoEn: string;
  actualizadoEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function crearSubtarea(token: string, tareaId: string, datos: { titulo: string }) {
  return peticionApi<Subtarea>(`/tareas/${tareaId}/subtareas`, {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function actualizarSubtarea(
  token: string,
  id: string,
  datos: Partial<{ titulo: string; completada: boolean }>,
) {
  return peticionApi<Subtarea>(`/subtareas/${id}`, {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function eliminarSubtarea(token: string, id: string) {
  return peticionApi<void>(`/subtareas/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
