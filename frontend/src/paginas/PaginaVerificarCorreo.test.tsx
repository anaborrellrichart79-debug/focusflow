import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaVerificarCorreo } from './PaginaVerificarCorreo';

describe('PaginaVerificarCorreo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía el token del enlace a la API y muestra que el correo está verificado', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => null } as Response);

    renderizarPagina(<PaginaVerificarCorreo />, { ruta: '/verificar-correo?token=abc123' });

    expect(await screen.findByRole('status')).toHaveTextContent('Tu correo ya está verificado');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/verificar-correo',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'abc123' }) }),
    );
  });

  it('con un enlace caducado, muestra el error traducido', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        message: 'Enlace de verificación caducado o inválido',
        codigo: 'ENLACE_VERIFICACION_NO_VALIDO',
      }),
    } as Response);

    renderizarPagina(<PaginaVerificarCorreo />, { ruta: '/verificar-correo?token=caducado' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Enlace de verificación caducado o inválido');
  });

  it('sin token en el enlace, avisa sin llamar a la API', () => {
    renderizarPagina(<PaginaVerificarCorreo />, { ruta: '/verificar-correo' });

    expect(screen.getByRole('alert')).toHaveTextContent('falta el código de verificación');
    expect(fetch).not.toHaveBeenCalled();
  });
});
