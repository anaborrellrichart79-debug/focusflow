import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { AvisoVerificarCorreo } from './AvisoVerificarCorreo';

const SESION_SIN_VERIFICAR = {
  ...SESION_AUTENTICADA,
  usuario: { ...SESION_AUTENTICADA.usuario!, correoVerificado: false },
};

function respuesta(ok: boolean, cuerpo: unknown, status = ok ? 200 : 400) {
  return { ok, status, json: async () => cuerpo } as Response;
}

describe('AvisoVerificarCorreo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('no se muestra si el correo está verificado (o la cuenta es anterior y no lo indica)', () => {
    renderizarPagina(<AvisoVerificarCorreo />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.queryByText(/Confirma tu correo/)).not.toBeInTheDocument();
  });

  it('recuerda confirmar el correo y reenvía el enlace', async () => {
    const usuario = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(respuesta(true, null));

    renderizarPagina(<AvisoVerificarCorreo />, { estadoPrecargado: { sesion: SESION_SIN_VERIFICAR } });

    expect(
      screen.getByText(`Confirma tu correo: te hemos enviado un enlace a ${SESION_AUTENTICADA.usuario!.correo}.`, {
        exact: false,
      }),
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Reenviar el correo' }));

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/reenviar-verificacion',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Correo reenviado');
  });

  it('si se pide demasiado pronto, muestra el error traducido', async () => {
    const usuario = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      respuesta(false, {
        message: 'Espera unos minutos antes de volver a pedir el correo',
        codigo: 'ESPERA_REENVIO_CORREO',
      }),
    );

    renderizarPagina(<AvisoVerificarCorreo />, { estadoPrecargado: { sesion: SESION_SIN_VERIFICAR } });

    await usuario.click(screen.getByRole('button', { name: 'Reenviar el correo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Espera unos minutos');
  });

  it('"Ya lo he confirmado" vuelve a pedir el perfil y la franja desaparece si ya está verificado', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('focusflow.tokenAcceso', SESION_AUTENTICADA.tokenAcceso!);
    vi.mocked(fetch).mockResolvedValue(respuesta(true, { ...SESION_AUTENTICADA.usuario, correoVerificado: true }));

    renderizarPagina(<AvisoVerificarCorreo />, { estadoPrecargado: { sesion: SESION_SIN_VERIFICAR } });

    await usuario.click(screen.getByRole('button', { name: 'Ya lo he confirmado' }));

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/autenticacion/perfil', expect.anything());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ya lo he confirmado' })).not.toBeInTheDocument());
  });
});
