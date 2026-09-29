import { peticionApi } from './api';

// Estado de los avisos Web Push en este navegador:
// - no-soportado: el navegador no tiene Service Worker / Push (p. ej. iPhone
//   sin haber instalado la app en la pantalla de inicio).
// - no-configurado: el servidor no tiene claves VAPID.
// - bloqueado: el usuario denegó el permiso de notificaciones.
export type EstadoPush = 'no-soportado' | 'no-configurado' | 'bloqueado' | 'inactivo' | 'activo';

// Para que VigilanteAvisos no duplique con la app abierta la notificación que
// ya enseña el service worker. Solo es una comodidad de este dispositivo.
const CLAVE_PUSH_ACTIVO = 'focusflow.pushActivo';

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function pushSoportado() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof PushManager !== 'undefined';
}

export function pushActivoEnEsteDispositivo() {
  try {
    return localStorage.getItem(CLAVE_PUSH_ACTIVO) === '1';
  } catch {
    return false;
  }
}

function recordarActivo(activo: boolean) {
  try {
    if (activo) localStorage.setItem(CLAVE_PUSH_ACTIVO, '1');
    else localStorage.removeItem(CLAVE_PUSH_ACTIVO);
  } catch {
    /* almacenamiento no disponible */
  }
}

// La clave pública VAPID llega en base64url; PushManager la quiere en bytes.
export function claveABytes(base64url: string) {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (caracter) => caracter.charCodeAt(0));
}

async function suscripcionActual() {
  const registro = await navigator.serviceWorker.getRegistration();
  return registro ? registro.pushManager.getSubscription() : null;
}

export async function obtenerEstadoPush(token: string): Promise<EstadoPush> {
  if (!pushSoportado()) return 'no-soportado';
  const { clavePublica } = await peticionApi<{ clavePublica: string | null }>('/push/clave-publica', {
    headers: cabeceras(token),
  });
  if (!clavePublica) return 'no-configurado';
  if (Notification.permission === 'denied') return 'bloqueado';
  const activo = Boolean(await suscripcionActual()) && Notification.permission === 'granted';
  recordarActivo(activo);
  return activo ? 'activo' : 'inactivo';
}

export async function activarPush(token: string): Promise<EstadoPush> {
  const { clavePublica } = await peticionApi<{ clavePublica: string | null }>('/push/clave-publica', {
    headers: cabeceras(token),
  });
  if (!clavePublica) return 'no-configurado';

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueado' : 'inactivo';

  const registro = await navigator.serviceWorker.ready;
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveABytes(clavePublica),
    }));

  await peticionApi<void>('/push/suscripciones', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(suscripcion.toJSON()),
  });
  recordarActivo(true);
  return 'activo';
}

export function enviarPruebaPush(token: string) {
  return peticionApi<{ dispositivos: number }>('/push/prueba', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

// También al cerrar sesión: el dispositivo deja de recibir los avisos de esta
// cuenta. Anular la suscripción en el navegador basta aunque falle la llamada
// al servidor (token caducado...): el siguiente envío recibe un 410 y el
// backend la borra.
export async function desactivarPush(token: string | null) {
  recordarActivo(false);
  if (!pushSoportado()) return;
  const suscripcion = await suscripcionActual();
  if (!suscripcion) return;
  const { endpoint } = suscripcion;
  await suscripcion.unsubscribe();
  if (token) {
    await peticionApi<void>('/push/suscripciones', {
      method: 'DELETE',
      headers: cabeceras(token),
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  }
}
