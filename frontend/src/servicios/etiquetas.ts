import { peticionApi } from './api';

export interface Etiqueta {
  id: string;
  nombre: string;
  // Etiqueta de la que cuelga (hasta 3 niveles, ver utilidades/etiquetas.ts).
  // Opcional en el tipo para no obligar a cada dato de prueba a incluirlo.
  padreId?: string | null;
  usuarioId: string;
  creadoEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function listarEtiquetas(token: string) {
  return peticionApi<Etiqueta[]>('/etiquetas', { headers: cabeceras(token) });
}

export function crearEtiqueta(token: string, datos: { nombre: string; padreId?: string }) {
  return peticionApi<Etiqueta>('/etiquetas', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function actualizarEtiqueta(
  token: string,
  id: string,
  datos: { nombre?: string; padreId?: string | null },
) {
  return peticionApi<Etiqueta>(`/etiquetas/${id}`, {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function eliminarEtiqueta(token: string, id: string) {
  return peticionApi<void>(`/etiquetas/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
