import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import type { CalendarioEscolar, ConfiguracionRecordatorios } from '@/servicios/recordatorios';
import { PaginaRecordatorios } from './PaginaRecordatorios';

const CONFIGURACION: ConfiguracionRecordatorios = {
  recordatorios: [
    {
      id: 'rec-1',
      tipo: 'REVISION_SEMANAL',
      activo: true,
      diaSemana: 0,
      hora: '18:00',
      horasAntes: null,
      diasAntes: null,
      soloEscolar: false,
      porCorreo: false,
    },
  ],
  emergencia: { activa: false, dias: 3, porCorreo: false },
  correoDisponible: false,
  iaDisponible: true,
};

const CALENDARIO: CalendarioEscolar = {
  curso: '2026-2027',
  comunidad: 'COMUNITAT_VALENCIANA',
  inicioClases: '2026-09-09',
  finClases: '2027-06-18',
  periodos: [{ clave: 'navidad', nombre: 'Vacaciones de Navidad', inicio: '2026-12-22', fin: '2027-01-06' }],
  propios: [],
};

function simularApi() {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const cuerpo = opciones?.body ? JSON.parse(opciones.body as string) : null;
    let respuesta: unknown = null;
    if (url.endsWith('/recordatorios') && opciones?.method === 'POST') {
      respuesta = { id: 'rec-nuevo', activo: true, diaSemana: null, hora: null, horasAntes: null, diasAntes: null, soloEscolar: false, porCorreo: false, ...cuerpo };
    } else if (url.endsWith('/recordatorios/emergencia')) {
      respuesta = { ...CONFIGURACION.emergencia, ...cuerpo };
    } else if (url.endsWith('/recordatorios')) {
      respuesta = CONFIGURACION;
    } else if (url.endsWith('/avisos')) {
      respuesta = [];
    } else if (url.endsWith('/calendario-escolar')) {
      respuesta = CALENDARIO;
    }
    return { ok: true, json: async () => respuesta } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('PaginaRecordatorios', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra las alarmas configuradas y el aviso de que el correo no está configurado', async () => {
    simularApi();
    renderizarPagina(<PaginaRecordatorios />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Cada domingo a las 18:00')).toBeInTheDocument();
    expect(screen.getByText('Todavía no tienes avisos. Crea una alarma abajo para empezar.')).toBeInTheDocument();
    expect(screen.getByText(/se redactan con IA local \(Ollama\)/)).toBeInTheDocument();
  });

  it('crea una alarma de entrega con las horas indicadas', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaRecordatorios />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const formulario = await screen.findByRole('form', { name: 'Nueva alarma' });
    await usuario.selectOptions(within(formulario).getByLabelText('Tipo de alarma'), 'ENTREGA');
    const horas = within(formulario).getByLabelText('Horas antes de la entrega:');
    await usuario.clear(horas);
    await usuario.type(horas, '48');
    await usuario.click(within(formulario).getByRole('button', { name: 'Añadir alarma' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/recordatorios',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tipo: 'ENTREGA', horasAntes: 48, soloEscolar: false, porCorreo: false }),
      }),
    );
    expect(await screen.findByText('48 horas antes de cada fecha límite')).toBeInTheDocument();
  });

  it('activar el modo emergencia lo guarda en el servidor', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaRecordatorios />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(await screen.findByRole('checkbox', { name: 'Activar el modo emergencia' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/recordatorios/emergencia',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ activa: true }) }),
    );
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Activar el modo emergencia' })).toBeChecked(),
    );
  });

  it('sin modo escolar no ofrece las alarmas de vacaciones ni el calendario escolar', async () => {
    simularApi();
    renderizarPagina(<PaginaRecordatorios />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const formulario = await screen.findByRole('form', { name: 'Nueva alarma' });
    expect(within(formulario).queryByRole('option', { name: 'Vacaciones y festivos escolares' })).toBeNull();
    expect(screen.queryByText('Calendario escolar 2026-2027')).not.toBeInTheDocument();
  });

  it('con modo escolar muestra el calendario precargado de la comunidad', async () => {
    simularApi();
    renderizarPagina(<PaginaRecordatorios />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });

    expect(await screen.findByText('Calendario escolar 2026-2027')).toBeInTheDocument();
    expect(
      screen.getByText('Comunitat Valenciana: las clases van del 9 de septiembre al 18 de junio.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Vacaciones de Navidad')).toBeInTheDocument();
    expect(screen.getByText('del 22 de diciembre al 6 de enero')).toBeInTheDocument();
  });
});
