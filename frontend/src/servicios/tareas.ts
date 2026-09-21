import type { Etiqueta } from './etiquetas';
import { peticionApi } from './api';
import type { Subtarea } from './subtareas';

export type EstadoTarea = 'POR_HACER' | 'EN_PROCESO' | 'HECHA';
export type Recurrencia = 'NINGUNA' | 'DIARIA' | 'SEMANAL';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  urgente: boolean;
  importante: boolean;
  esAltoImpacto: boolean;
  fechaLimite: string | null;
  recurrencia: Recurrencia;
  tiempoEstimadoMinutos: number | null;
  objetivoId: string | null;
  usuarioId: string;
  subtareas: Subtarea[];
  etiquetas: Etiqueta[];
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
  datos: {
    titulo: string;
    descripcion?: string;
    objetivoId?: string;
    fechaLimite?: string;
    etiquetas?: string[];
    recurrencia?: Recurrencia;
    tiempoEstimadoMinutos?: number;
  },
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
  datos: Partial<{
    titulo: string;
    descripcion: string;
    estado: EstadoTarea;
    urgente: boolean;
    importante: boolean;
    esAltoImpacto: boolean;
    fechaLimite: string;
    etiquetas: string[];
    recurrencia: Recurrencia;
    tiempoEstimadoMinutos: number;
  }>,
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
