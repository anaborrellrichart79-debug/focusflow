import { peticionApi } from './api';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  completada: boolean;
  objetivoId: string | null;
  usuarioId: string;
  creadoEn: string;
  actualizadoEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function listarTareas(token: string) {
  return peticionApi<Tarea[]>('/tareas', { headers: cabeceras(token) });
}

export function crearTarea(
  token: string,
  datos: { titulo: string; descripcion?: string; objetivoId?: string },
) {
  return peticionApi<Tarea>('/tareas', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function actualizarTarea(
  token: string,
  id: string,
  datos: Partial<{ titulo: string; descripcion: string; completada: boolean }>,
) {
  return peticionApi<Tarea>(`/tareas/${id}`, {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function eliminarTarea(token: string, id: string) {
  return peticionApi<void>(`/tareas/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
