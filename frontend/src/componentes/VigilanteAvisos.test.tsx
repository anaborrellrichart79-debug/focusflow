import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Aviso } from '@/servicios/recordatorios';
import { reproducirAlarmaEmergencia, reproducirAvisoRecordatorio } from '@/utilidades/sonido';
import { VigilanteAvisos } from './VigilanteAvisos';

vi.mock('@/utilidades/sonido', () => ({
  reproducirAvisoRecordatorio: vi.fn(),
  reproducirAlarmaEmergencia: vi.fn(),
}));

function aviso(parcial: Partial<Aviso> & Pick<Aviso, 'id' | 'tipo' | 'datos'>): Aviso {
  return {
    mensajeIa: null,
    mostradoEn: null,
    leidoEn: null,
    correoEnviadoEn: null,
    tareaId: null,
    creadoEn: '2026-09-23T10:00:00.000Z',
    ...parcial,
  } as Aviso;
}

const ENTREGA = aviso({
  id: 'a-entrega',
  tipo: 'ENTREGA',
  datos: { titulo: 'Maqueta', fechaLimite: '2026-09-24T09:00:00.000Z', horasRestantes: 21 },
});
const EMERGENCIA = aviso({
  id: 'a-emergencia',
  tipo: 'EMERGENCIA',
  tareaId: 'tarea-olvidada',
  mensajeIa: '¡Hoy es buen día para ponerte con ello!',
  datos: { titulo: 'Ordenar apuntes', diasSinTocar: 4 },
});

function simularApi(avisos: Aviso[]) {
  const fetchFalso = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.endsWith('/avisos') ? avisos : null),
  }));
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('VigilanteAvisos', () => {
  const notificacionFalsa = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    notificacionFalsa.mockImplementation(function (this: Record<string, unknown>) {
      this.close = vi.fn();
    });
    vi.stubGlobal('Notification', Object.assign(notificacionFalsa, { permission: 'granted' }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('un aviso nuevo suena, sale como notificación del navegador y se marca como mostrado', async () => {
    const fetchFalso = simularApi([ENTREGA]);

    renderizarPagina(<VigilanteAvisos />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await waitFor(() => expect(reproducirAvisoRecordatorio).toHaveBeenCalledTimes(1));
    expect(reproducirAlarmaEmergencia).not.toHaveBeenCalled();
    expect(notificacionFalsa).toHaveBeenCalledWith(
      'Entrega en 21 h: Maqueta',
      expect.objectContaining({ requireInteraction: false }),
    );
    await waitFor(() =>
      expect(fetchFalso).toHaveBeenCalledWith(
        'http://localhost:3000/avisos/mostrados',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ ids: ['a-entrega'] }) }),
      ),
    );
  });

  it('no vuelve a sonar por un aviso ya mostrado', async () => {
    simularApi([{ ...ENTREGA, mostradoEn: '2026-09-23T10:01:00.000Z' }]);

    const { tienda } = renderizarPagina(<VigilanteAvisos />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    await waitFor(() => expect(tienda.getState().recordatorios.avisos).toHaveLength(1));
    expect(reproducirAvisoRecordatorio).not.toHaveBeenCalled();
    expect(notificacionFalsa).not.toHaveBeenCalled();
  });

  it('una emergencia hace sonar la alarma y abre el aviso con sus tareas y el texto de la IA', async () => {
    simularApi([EMERGENCIA]);

    renderizarPagina(<VigilanteAvisos />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByRole('dialog', { name: 'Modo emergencia' })).toBeInTheDocument();
    expect(reproducirAlarmaEmergencia).toHaveBeenCalledTimes(1);
    expect(notificacionFalsa).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ requireInteraction: true }),
    );
    expect(screen.getByText('Ordenar apuntes')).toBeInTheDocument();
    expect(screen.getByText('4 días sin revisar')).toBeInTheDocument();
    expect(screen.getByText('¡Hoy es buen día para ponerte con ello!')).toBeInTheDocument();
  });

  it('"Ya la he revisado" avisa al servidor y cierra la alarma', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi([EMERGENCIA]);

    renderizarPagina(<VigilanteAvisos />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });
    await usuario.click(await screen.findByRole('button', { name: 'Ya la he revisado' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/avisos/tareas/tarea-olvidada/revisada',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('"Recordármelo más tarde" cierra la alarma sin marcar nada como revisado', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi([EMERGENCIA]);

    renderizarPagina(<VigilanteAvisos />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });
    await usuario.click(await screen.findByRole('button', { name: 'Recordármelo más tarde' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetchFalso).not.toHaveBeenCalledWith(
      expect.stringContaining('/revisada'),
      expect.anything(),
    );
  });
});
