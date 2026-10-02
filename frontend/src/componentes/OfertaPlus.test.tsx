import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { OfertaPlus } from './OfertaPlus';

function conEstado(estado: Record<string, unknown>) {
  const fetchFalso = vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      status: url.includes('/consejos/') ? 204 : 200,
      json: async () => (url.includes('/consejos/') ? null : estado),
    } as Response),
  );
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

const GRATUITA = { incluida: false, origen: null, usados: 0, limite: 100, puedeContratar: true, consejosVistos: [] };

function esperar() {
  return new Promise((resolver) => setTimeout(resolver, 50));
}

describe('OfertaPlus', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a una adulta sin Plus le enseña las ventajas una vez por inicio de sesión', async () => {
    conEstado(GRATUITA);
    const { unmount } = renderizarPagina(<OfertaPlus />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByRole('dialog', { name: /Haz en 1 minuto lo que te lleva una tarde/ })).toBeInTheDocument();
    expect(screen.getByText('Horario desde una foto:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pasar a Plus' })).toBeInTheDocument();
    unmount();

    // Misma sesión (mismo token): ya no sale.
    renderizarPagina(<OfertaPlus />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });
    await esperar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('con «No volver a mostrar» lo guarda en el servidor al cerrar', async () => {
    const fetchFalso = conEstado(GRATUITA);
    renderizarPagina(<OfertaPlus />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('checkbox', { name: 'No volver a mostrar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }));

    expect(fetchFalso.mock.calls.some(([url]) => String(url).endsWith('/planes/consejos/oferta-inicio'))).toBe(true);
  });

  it('con la oferta de lanzamiento vigente dice hasta cuándo y el código', async () => {
    conEstado({ ...GRATUITA, ofertaHasta: '2026-10-31', ofertaCodigo: 'LANZAMIENTO' });
    renderizarPagina(<OfertaPlus />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText(/hasta el 31 de octubre: pon el código LANZAMIENTO/)).toBeInTheDocument();
  });

  it('nunca sale a un menor ni a quien ya tiene Plus', async () => {
    conEstado({ ...GRATUITA, puedeContratar: false });
    renderizarPagina(<OfertaPlus />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });
    await esperar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
