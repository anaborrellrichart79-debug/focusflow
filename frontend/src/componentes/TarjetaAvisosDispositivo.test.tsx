import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { TarjetaAvisosDispositivo } from './TarjetaAvisosDispositivo';

describe('TarjetaAvisosDispositivo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('en un navegador sin Web Push explica cómo conseguirlo y no ofrece activar', async () => {
    renderizarPagina(<TarjetaAvisosDispositivo />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByRole('status')).toHaveTextContent('Este navegador no permite avisos con la app cerrada');
    expect(screen.queryByRole('button', { name: 'Activar avisos en este dispositivo' })).not.toBeInTheDocument();
  });

  it('con Web Push disponible y sin activar, ofrece activarlo', async () => {
    vi.stubGlobal('PushManager', class {});
    vi.stubGlobal('Notification', { permission: 'default' });
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue(undefined) },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ clavePublica: 'clave' }) } as Response),
    );

    renderizarPagina(<TarjetaAvisosDispositivo />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByRole('button', { name: 'Activar avisos en este dispositivo' })).toBeInTheDocument();
  });
});
