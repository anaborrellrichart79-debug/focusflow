import { peticionApi } from './api';

export interface SesionEstudio {
  fecha: string; // YYYY-MM-DD
  titulo: string;
  minutos: number;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Propuestas de la IA local (Ollama): no guardan nada; lo que el usuario
// acepte se crea después con los endpoints de siempre.
export function proponerSubtareas(token: string, tareaId: string) {
  return peticionApi<{ pasos: string[] }>(`/tareas/${tareaId}/ia/subtareas`, {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function proponerPlanEstudio(token: string, tareaId: string) {
  return peticionApi<{ sesiones: SesionEstudio[] }>(`/tareas/${tareaId}/ia/plan-estudio`, {
    method: 'POST',
    headers: cabeceras(token),
  });
}
