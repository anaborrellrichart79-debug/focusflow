import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { EstadoIa } from '@/servicios/planes';
import { ConsejoPlus } from './ConsejoPlus';

const GRATUITA: EstadoIa = {
  incluida: false,
  origen: null,
  usados: 0,
  limite: 100,
  puedeContratar: true,
  consejosVistos: [],
};

describe('ConsejoPlus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function conFetch() {
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response);
    vi.stubGlobal('fetch', fetchFalso);
    return fetchFalso;
  }

  it('la primera vez sale, lo marca como visto y se puede cerrar', async () => {
    const fetchFalso = conFetch();
    renderizarPagina(<ConsejoPlus consejo="horario" estadoIa={GRATUITA} />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(await screen.findByText('Tu horario, listo en 1 minuto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver el plan Plus' })).toHaveAttribute('href', '/planes');
    expect(fetchFalso.mock.calls[0][0]).toMatch(/\/planes\/consejos\/horario$/);
    expect(fetchFalso.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el consejo' }));
    expect(screen.queryByText('Tu horario, listo en 1 minuto')).not.toBeInTheDocument();
  });

  it('si ya lo ha visto, no vuelve a salir', () => {
    const fetchFalso = conFetch();
    renderizarPagina(<ConsejoPlus consejo="horario" estadoIa={{ ...GRATUITA, consejosVistos: ['horario'] }} />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.queryByText('Tu horario, listo en 1 minuto')).not.toBeInTheDocument();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('a un menor (no puede contratar) no se le enseña', () => {
    conFetch();
    renderizarPagina(<ConsejoPlus consejo="pasos" estadoIa={{ ...GRATUITA, puedeContratar: false }} />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.queryByText('¿No sabes por dónde empezar?')).not.toBeInTheDocument();
  });
});
