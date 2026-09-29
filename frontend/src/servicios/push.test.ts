import { afterEach, describe, expect, it, vi } from 'vitest';
import { claveABytes, obtenerEstadoPush, pushActivoEnEsteDispositivo } from './push';

describe('servicio de Web Push', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('convierte la clave VAPID de base64url a bytes', () => {
    // "hola?" en base64 es "aG9sYT8=", en base64url sin relleno "aG9sYT8".
    expect(Array.from(claveABytes('aG9sYT8'))).toEqual([104, 111, 108, 97, 63]);
    // "-" y "_" de base64url equivalen a "+" y "/".
    expect(Array.from(claveABytes('-_8'))).toEqual([251, 255]);
  });

  it('sin Service Worker ni PushManager el navegador no lo admite', async () => {
    expect(await obtenerEstadoPush('token')).toBe('no-soportado');
  });

  it('si el servidor no tiene claves VAPID, no está configurado', async () => {
    vi.stubGlobal('PushManager', class {});
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: {} });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ clavePublica: null }) } as Response),
    );

    expect(await obtenerEstadoPush('token')).toBe('no-configurado');
  });

  it('por defecto este dispositivo no tiene los avisos push activos', () => {
    expect(pushActivoEnEsteDispositivo()).toBe(false);
  });
});
