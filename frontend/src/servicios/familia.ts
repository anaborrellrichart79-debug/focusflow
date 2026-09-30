import { peticionApi } from './api';
import type { Ambito, Persona, Tarea, TipoEscolar } from './tareas';

export interface PersonaVinculada extends Persona {
  vinculoId: string;
}

// Persona que supervisa este usuario: además, si le deja usar la IA.
export interface PersonaSupervisada extends PersonaVinculada {
  iaPermitida: boolean;
}

export interface EstadoFamilia {
  // Código vigente que ha generado este usuario para que lo vincule un responsable.
  codigo: { codigo: string; expiraEn: string } | null;
  // Personas cuyas tareas revisa este usuario.
  supervisados: PersonaSupervisada[];
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

export interface ResultadoVinculo extends PersonaSupervisada {
  // true si el vínculo ha confirmado la cuenta pendiente de un menor.
  consentimientoConcedido: boolean;
}

export function vincularConCodigo(token: string, codigo: string) {
  return peticionApi<ResultadoVinculo>('/familia/vincular', {
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

// El padre, la madre o el tutor enciende o apaga la IA de quien supervisa.
export function cambiarIaSupervisado(token: string, supervisadoId: string, permitida: boolean) {
  return peticionApi<{ iaPermitida: boolean }>(`/familia/supervisados/${supervisadoId}/ia`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ permitida }),
  });
}
