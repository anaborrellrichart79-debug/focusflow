import { peticionApi } from './api';

export interface EstadoIa {
  // Si la cuenta tiene la ayuda de la IA, y por qué: su propio plan de pago
  // o el de un adulto vinculado (plan familiar).
  incluida: boolean;
  origen: 'PROPIO' | 'FAMILIA' | null;
  // Usos del asistente este mes y el máximo.
  usados: number;
  limite: number;
}

export function obtenerEstadoIa(token: string) {
  return peticionApi<EstadoIa>('/planes/ia', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
