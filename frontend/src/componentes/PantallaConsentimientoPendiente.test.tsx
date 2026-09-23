import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PantallaConsentimientoPendiente } from './PantallaConsentimientoPendiente';

const SESION_PENDIENTE = {
  ...SESION_AUTENTICADA,
  usuario: { ...SESION_AUTENTICADA.usuario!, consentimientoConfirmado: false },
};

function respuesta(ok: boolean, cuerpo: unknown, status = ok ? 200 : 400) {
  return { ok, status, json: async () => cuerpo } as Response;
}

describe('PantallaConsentimientoPendiente', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('reenviar el correo llama a la API y avisa de que se ha enviado', async () => {
    const usuario = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(respuesta(true, null));

    renderizarPagina(<PantallaConsentimientoPendiente />, {
      estadoPrecargado: { sesion: SESION_PENDIENTE },
    });

    await usuario.click(screen.getByRole('button', { name: 'Reenviar el correo' }));

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/reenviar-confirmacion',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Correo reenviado');
  });

  it('si el reenvío falla, muestra el mensaje del servidor', async () => {
    const usuario = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      respuesta(false, { message: 'El envío de correo no está configurado en el servidor' }),
    );

    renderizarPagina(<PantallaConsentimientoPendiente />, {
      estadoPrecargado: { sesion: SESION_PENDIENTE },
    });

    await usuario.click(screen.getByRole('button', { name: 'Reenviar el correo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El envío de correo no está configurado en el servidor',
    );
  });

  it('"Ya lo ha confirmado" vuelve a pedir el perfil y actualiza la sesión', async () => {
    const usuario = userEvent.setup();
    // restaurarSesion lee el token de localStorage, igual que al arrancar la app.
    localStorage.setItem('focusflow.tokenAcceso', 'token-de-prueba');
    vi.mocked(fetch).mockResolvedValue(
      respuesta(true, { ...SESION_PENDIENTE.usuario, consentimientoConfirmado: true }),
    );

    const { tienda } = renderizarPagina(<PantallaConsentimientoPendiente />, {
      estadoPrecargado: { sesion: SESION_PENDIENTE },
    });

    await usuario.click(screen.getByRole('button', { name: 'Ya lo ha confirmado' }));

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/perfil',
      expect.anything(),
    );
    expect(tienda.getState().sesion.usuario?.consentimientoConfirmado).toBe(true);
  });
});
