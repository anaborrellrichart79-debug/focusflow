import { peticionApi } from './api';

export interface EstadoIa {
  // Si la cuenta tiene la ayuda de la IA, y por qué: su propio plan de pago
  // o el de un adulto vinculado (plan familiar).
  incluida: boolean;
  origen: 'PROPIO' | 'FAMILIA' | null;
  // Su padre, madre o tutor la ha apagado desde la página Familia.
  desactivadaPorFamilia?: boolean;
  // Usos del asistente este mes y el máximo.
  usados: number;
  limite: number;
  // Los usos son una bolsa compartida con las cuentas vinculadas a quien paga.
  compartidos?: boolean;
  // Suscripción de Stripe (las cuentas antiguas de la API pueden no traerlo).
  cortesia?: boolean;
  plusHasta?: string | null;
  bajaAlFinalDelPeriodo?: boolean;
  pagoPendiente?: boolean;
  // Adulta y sin IA: se le puede ofrecer el Plus (a los menores, nunca).
  puedeContratar?: boolean;
  // Consejos del Plus ya enseñados (cada uno sale una sola vez).
  consejosVistos?: string[];
  // Último día de la oferta de lanzamiento (AAAA-MM-DD), o null si no hay.
  ofertaHasta?: string | null;
  ofertaCodigo?: string | null;
}

export type ConsejoPlus = 'oferta-inicio' | 'horario' | 'examenes' | 'deberes' | 'pasos' | 'plan-estudio';

export function obtenerEstadoIa(token: string) {
  return peticionApi<EstadoIa>('/planes/ia', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function marcarConsejoVisto(token: string, consejo: ConsejoPlus) {
  return peticionApi<void>(`/planes/consejos/${consejo}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}
