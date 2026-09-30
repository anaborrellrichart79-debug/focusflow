import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { TarjetaPlan } from './TarjetaPlan';

function conEstado(estado: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => estado } as Response));
}

describe('TarjetaPlan', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plan gratuito: explica qué añade Plus', async () => {
    conEstado({ incluida: false, origen: null, usados: 0, limite: 100 });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText(/Gratuito: todas las funciones/)).toBeInTheDocument();
    expect(screen.getByText(/Con Plus, la IA divide tus tareas/)).toBeInTheDocument();
  });

  it('plan de pago: enseña los usos del mes', async () => {
    conEstado({ incluida: true, origen: 'PROPIO', usados: 12, limite: 100 });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Plus: con la ayuda de la IA.')).toBeInTheDocument();
    expect(screen.getByText('Este mes: 12 de 100 usos.')).toBeInTheDocument();
  });

  it('menor con el plan de su familia: lo dice, y que los usos son compartidos', async () => {
    conEstado({ incluida: true, origen: 'FAMILIA', usados: 42, limite: 100, compartidos: true });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText(/Plus a través de tu familia/)).toBeInTheDocument();
    expect(screen.getByText('Este mes: 42 de 100 usos, compartidos con tu familia.')).toBeInTheDocument();
  });
});
