import { peticionApi } from './api';
import type { Ambito, Persona, Tarea, TipoEscolar } from './tareas';

export interface PersonaVinculada extends Persona {
  vinculoId: string;
}

export interface EstadoFamilia {
  // Código vigente que ha generado este usuario para que lo vincule un responsable.
  codigo: { codigo: string; expiraEn: string } | null;
  // Personas cuyas tareas revisa este usuario.
  supervisados: PersonaVinculada[];
  // Personas que revisan las tareas de este usuario.
  responsables: PersonaVinculada[];
}

// Tarea del supervisado tal como la ve su responsable (sin etiquetas ni
// asignatura: son cosas de la cuenta del supervisado).
export type TareaSupervisada = Omit<Tarea, 'etiquetas'>;

export interface NuevaTareaAsignada {
  titulo: string;
  descripcion?: string;
  fechaLimite?: string;
  ambito?: Ambito;
  tipoEscolar?: TipoEscolar;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function obtenerFamilia(token: string) {
  return peticionApi<EstadoFamilia>('/familia', { headers: cabeceras(token) });
}

export function generarCodigoVinculo(token: string) {
  return peticionApi<{ codigo: string; expiraEn: string }>('/familia/codigo', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function vincularConCodigo(token: string, codigo: string) {
  return peticionApi<PersonaVinculada>('/familia/vincular', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify({ codigo }),
  });
}

export function desvincular(token: string, vinculoId: string) {
  return peticionApi<void>(`/familia/vinculos/${vinculoId}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}

export function listarTareasSupervisado(token: string, supervisadoId: string) {
  return peticionApi<TareaSupervisada[]>(`/familia/supervisados/${supervisadoId}/tareas`, {
    headers: cabeceras(token),
  });
}

export function asignarTarea(token: string, supervisadoId: string, datos: NuevaTareaAsignada) {
  return peticionApi<TareaSupervisada>(`/familia/supervisados/${supervisadoId}/tareas`, {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function revisarTarea(
  token: string,
  tareaId: string,
  datos: { decision: 'APROBADA' | 'DEVUELTA'; comentario?: string },
) {
  return peticionApi<TareaSupervisada>(`/familia/tareas/${tareaId}/revision`, {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}
