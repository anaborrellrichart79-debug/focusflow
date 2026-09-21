import { peticionApi } from './api';

export interface Etiqueta {
  id: string;
  nombre: string;
  usuarioId: string;
  creadoEn: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function listarEtiquetas(token: string) {
  return peticionApi<Etiqueta[]>('/etiquetas', { headers: cabeceras(token) });
}
