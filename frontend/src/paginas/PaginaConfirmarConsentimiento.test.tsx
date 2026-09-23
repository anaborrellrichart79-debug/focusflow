import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaConfirmarConsentimiento } from './PaginaConfirmarConsentimiento';

describe('PaginaConfirmarConsentimiento', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía el token del enlace a la API y muestra la confirmación', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => null } as Response);

    renderizarPagina(<PaginaConfirmarConsentimiento />, {
      ruta: '/confirmar-consentimiento?token=abc123',
    });

    expect(await screen.findByRole('status')).toHaveTextContent('La cuenta ya está confirmada');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/confirmar-consentimiento',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'abc123' }) }),
    );
  });

  it('con un enlace caducado, muestra el error del servidor', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Enlace de confirmación caducado o inválido' }),
    } as Response);

    renderizarPagina(<PaginaConfirmarConsentimiento />, {
      ruta: '/confirmar-consentimiento?token=caducado',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enlace de confirmación caducado o inválido',
    );
  });

  it('sin token en el enlace, avisa sin llamar a la API', () => {
    renderizarPagina(<PaginaConfirmarConsentimiento />, { ruta: '/confirmar-consentimiento' });

    expect(screen.getByRole('alert')).toHaveTextContent('falta el código de confirmación');
    expect(fetch).not.toHaveBeenCalled();
  });
});
