import { peticionApi } from './api';

export interface Objetivo {
  id: string;
  titulo: string;
  descripcion: string | null;
  totalTareas: number;
  tareasCompletadas: number;
  creadoEn: string;
  actualizadoEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function listarObjetivos(token: string) {
  return peticionApi<Objetivo[]>('/objetivos', { headers: cabeceras(token) });
}

export function crearObjetivo(
  token: string,
  datos: { titulo: string; descripcion?: string },
) {
  return peticionApi<Objetivo>('/objetivos', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function eliminarObjetivo(token: string, id: string) {
  return peticionApi<void>(`/objetivos/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
