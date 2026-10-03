import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { AvisoVersionNueva } from './AvisoVersionNueva';

function versionPublicada(version: string) {
  return { ok: true, status: 200, json: async () => ({ version }) } as Response;
}

// Simula volver a la app (otra pestaña o sacarla del segundo plano).
async function volverALaApp() {
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('AvisoVersionNueva', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('avisa al volver a la app si se ha publicado otra versión', async () => {
    vi.mocked(fetch).mockResolvedValue(versionPublicada('otra-version'));
    renderizarPagina(<AvisoVersionNueva activo />);

    await volverALaApp();

    expect(await screen.findByText('Hay una versión nueva de FocusFlow.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/version.json', { cache: 'no-store' });
  });

  it('no dice nada si la versión publicada es la misma', async () => {
    vi.mocked(fetch).mockResolvedValue(versionPublicada(__VERSION_APP__));
    renderizarPagina(<AvisoVersionNueva activo />);

    await volverALaApp();

    expect(fetch).toHaveBeenCalled();
    expect(screen.queryByText('Hay una versión nueva de FocusFlow.')).not.toBeInTheDocument();
  });

  it('no dice nada si no hay conexión', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    renderizarPagina(<AvisoVersionNueva activo />);

    await volverALaApp();

    expect(screen.queryByText('Hay una versión nueva de FocusFlow.')).not.toBeInTheDocument();
  });

  it('en desarrollo no pregunta nada', async () => {
    renderizarPagina(<AvisoVersionNueva activo={false} />);

    await volverALaApp();

    expect(fetch).not.toHaveBeenCalled();
  });
});
