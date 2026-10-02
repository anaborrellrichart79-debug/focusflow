import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import * as pagos from '@/servicios/pagos';
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

  it('adulta en el plan gratuito: elige anual o mensual y va a la página de pago de Stripe', async () => {
    const irA = vi.spyOn(pagos, 'irA').mockImplementation(() => {});
    const fetchFalso = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ incluida: false, origen: null, usados: 0, limite: 100, puedeContratar: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: 'https://checkout.stripe.com/c/1' }),
      } as Response);
    vi.stubGlobal('fetch', fetchFalso);
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await userEvent.click(await screen.findByRole('radio', { name: /Mensual/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Pasar a Plus' }));

    const [url, opciones] = fetchFalso.mock.calls[1];
    expect(url).toMatch(/\/pagos\/checkout$/);
    expect(JSON.parse(opciones.body)).toEqual({ periodo: 'MENSUAL' });
    expect(irA).toHaveBeenCalledWith('https://checkout.stripe.com/c/1');
    irA.mockRestore();
  });

  it('menor sin IA: no puede pagar y se le dice que lo pida a su familia', async () => {
    conEstado({ incluida: false, origen: null, usados: 0, limite: 100, puedeContratar: false });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText(/pídele a tu padre, madre o tutor/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pasar a Plus' })).not.toBeInTheDocument();
  });

  it('Plus pagado: fecha de renovación y botón para gestionar la suscripción', async () => {
    conEstado({ incluida: true, origen: 'PROPIO', usados: 3, limite: 100, plusHasta: '2026-11-02T10:00:00.000Z' });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Se renueva el 2 de noviembre de 2026.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestionar suscripción' })).toBeInTheDocument();
  });

  it('dado de baja y con el cobro fallido: hasta cuándo tiene Plus y el aviso de pago', async () => {
    conEstado({
      incluida: true,
      origen: 'PROPIO',
      usados: 3,
      limite: 100,
      plusHasta: '2026-11-02T10:00:00.000Z',
      bajaAlFinalDelPeriodo: true,
      pagoPendiente: true,
    });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(
      await screen.findByText('Te has dado de baja: tienes Plus hasta el 2 de noviembre de 2026.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/No hemos podido cobrar la renovación/);
  });

  it('Plus de cortesía: sin botón de pago ni de gestionar', async () => {
    conEstado({ incluida: true, origen: 'PROPIO', usados: 0, limite: 100, cortesia: true });
    renderizarPagina(<TarjetaPlan />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Plus: con la ayuda de la IA.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gestionar suscripción' })).not.toBeInTheDocument();
  });

  it('al volver de pagar con Plus ya activo, da las gracias', async () => {
    conEstado({ incluida: true, origen: 'PROPIO', usados: 0, limite: 100 });
    renderizarPagina(<TarjetaPlan />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/ajustes?pago=ok',
    });

    expect(await screen.findByText(/Ya tienes Plus! Gracias/)).toBeInTheDocument();
  });
});
