import { peticionApi } from './api';

export type FasePomodoroApi = 'TRABAJO' | 'DESCANSO_CORTO' | 'DESCANSO_LARGO';

export interface SesionPomodoro {
  id: string;
  fase: FasePomodoroApi;
  duracionSegundos: number;
  usuarioId: string;
  tareaId: string | null;
  tarea: { id: string; titulo: string } | null;
  completadaEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function registrarSesionPomodoro(
  token: string,
  datos: { fase: FasePomodoroApi; duracionSegundos: number; tareaId?: string },
) {
  return peticionApi<SesionPomodoro>('/pomodoro/sesiones', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function listarSesionesPomodoro(token: string) {
  return peticionApi<SesionPomodoro[]>('/pomodoro/sesiones', { headers: cabeceras(token) });
}
