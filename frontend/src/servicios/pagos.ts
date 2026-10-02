import { peticionApi } from './api';

export type PeriodoPlus = 'MENSUAL' | 'ANUAL';

// Las dos devuelven la URL de una página de Stripe (pagar o gestionar la
// suscripción): la app no ve nunca los datos de la tarjeta.
export function crearCheckout(token: string, periodo: PeriodoPlus) {
  return peticionApi<{ url: string }>('/pagos/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ periodo }),
  });
}

export function abrirPortal(token: string) {
  return peticionApi<{ url: string }>('/pagos/portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Aparte para poder sustituirla en los tests (jsdom no navega).
export function irA(url: string) {
  window.location.assign(url);
}
