import { peticionApi } from './api';

export type TipoNota = 'NOTA' | 'TODO';

export interface Nota {
  id: string;
  tipo: TipoNota;
  contenido: string;
  // Las notas pueden llevar casilla; los to-dos la llevan siempre.
  conCasilla: boolean;
  completada: boolean;
  tareaId: string | null;
  tarea: { id: string; titulo: string } | null;
  objetivoId: string | null;
  objetivo: { id: string; titulo: string } | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface NuevaNota {
  tipo: TipoNota;
  contenido: string;
  conCasilla?: boolean;
  tareaId?: string;
  objetivoId?: string;
}

export type CambiosNota = Partial<{
  contenido: string;
  conCasilla: boolean;
  completada: boolean;
  tareaId: string | null;
  objetivoId: string | null;
}>;

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function listarNotas(token: string) {
  return peticionApi<Nota[]>('/notas', { headers: cabeceras(token) });
}

export function crearNota(token: string, datos: NuevaNota) {
  return peticionApi<Nota>('/notas', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function actualizarNota(token: string, id: string, cambios: CambiosNota) {
  return peticionApi<Nota>(`/notas/${id}`, {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(cambios),
  });
}

export function eliminarNota(token: string, id: string) {
  return peticionApi<void>(`/notas/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
