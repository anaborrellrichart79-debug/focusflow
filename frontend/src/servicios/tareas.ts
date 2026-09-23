import type { Etiqueta } from './etiquetas';
import { peticionApi } from './api';
import type { Subtarea } from './subtareas';

export type EstadoTarea =
  | 'POR_HACER'
  | 'EN_PROCESO'
  | 'BAJO_CONTROL'
  | 'POSPUESTA'
  | 'HECHA'
  | 'ARCHIVADA';
export type Recurrencia = 'NINGUNA' | 'DIARIA' | 'SEMANAL';
export type Ambito = 'PERSONAL' | 'ESCOLAR' | 'EVENTUAL';
export type EstadoRevision = 'PENDIENTE' | 'APROBADA' | 'DEVUELTA';

export interface Persona {
  id: string;
  nombre: string | null;
  correo: string;
}
export type TipoEscolar = 'EXAMEN' | 'TRABAJO' | 'PRESENTACION';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  urgente: boolean;
  importante: boolean;
  esAltoImpacto: boolean;
  fechaLimite: string | null;
  duracionMinutos: number | null;
  recurrencia: Recurrencia;
  tiempoEstimadoMinutos: number | null;
  ambito: Ambito;
  tipoEscolar: TipoEscolar | null;
  // Asignatura de un horario de clase, con su color (solo tareas escolares).
  // Opcionales en el tipo para no obligar a cada dato de prueba a incluirlas;
  // el backend siempre las devuelve (null si no hay).
  asignaturaHorarioId?: string | null;
  asignaturaHorario?: { id: string; color: string; asignatura: { nombre: string } } | null;
  // Revisión familiar (ver PaginaFamilia). Opcionales por la misma razón.
  revisorId?: string | null;
  revisor?: Persona | null;
  estadoRevision?: EstadoRevision | null;
  comentarioRevision?: string | null;
  creadaPorId?: string | null;
  creadaPor?: Persona | null;
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
    duracionMinutos?: number;
    etiquetas?: string[];
    recurrencia?: Recurrencia;
    tiempoEstimadoMinutos?: number;
    ambito?: Ambito;
    tipoEscolar?: TipoEscolar;
    asignaturaHorarioId?: string;
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
    duracionMinutos: number;
    etiquetas: string[];
    recurrencia: Recurrencia;
    tiempoEstimadoMinutos: number;
    ambito: Ambito;
    tipoEscolar: TipoEscolar | null;
    asignaturaHorarioId: string | null;
    revisorId: string | null;
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
