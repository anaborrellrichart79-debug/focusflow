import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { EstadoFamilia, TareaSupervisada } from '@/servicios/familia';
import { PaginaFamilia } from './PaginaFamilia';

const HIJA = { vinculoId: 'v-1', id: 'hija', nombre: 'Lucía', correo: 'lucia@example.com' };

function tareaSupervisada(datos: Partial<TareaSupervisada>): TareaSupervisada {
  return {
    id: 'tarea-1',
    titulo: 'Maqueta del sistema solar',
    descripcion: null,
    estado: 'HECHA',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    recurrencia: 'NINGUNA',
    tiempoEstimadoMinutos: null,
    ambito: 'ESCOLAR',
    tipoEscolar: null,
    objetivoId: null,
    usuarioId: 'hija',
    subtareas: [],
    revisorId: 'usuario-1',
    estadoRevision: 'PENDIENTE',
    creadoEn: '2026-09-20T10:00:00.000Z',
    actualizadoEn: '2026-09-23T10:00:00.000Z',
    ...datos,
  };
}

function simularApi(familia: EstadoFamilia, tareas: TareaSupervisada[] = []) {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const cuerpo = opciones?.body ? JSON.parse(opciones.body as string) : null;
    let respuesta: unknown = null;
    if (url.endsWith('/familia')) respuesta = familia;
    else if (url.endsWith('/familia/codigo'))
      respuesta = { codigo: 'K7P2QX', expiraEn: '2026-09-25T10:00:00.000Z' };
    else if (url.endsWith('/familia/vincular')) respuesta = HIJA;
    else if (url.endsWith('/revision'))
      respuesta = tareaSupervisada({ estadoRevision: cuerpo.decision, comentarioRevision: cuerpo.comentario ?? null });
    else if (url.includes('/supervisados/') && opciones?.method === 'POST')
      respuesta = tareaSupervisada({ id: 'nueva', titulo: cuerpo.titulo, estado: 'POR_HACER', estadoRevision: null });
    else if (url.includes('/supervisados/')) respuesta = tareas;
    return { ok: true, json: async () => respuesta } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

const SIN_NADIE: EstadoFamilia = { codigo: null, supervisados: [], responsables: [] };

describe('PaginaFamilia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('genera un código de vínculo y lo enseña', async () => {
    const usuario = userEvent.setup();
    simularApi(SIN_NADIE);
    renderizarPagina(<PaginaFamilia />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Todavía nadie revisa tus tareas.')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Generar código' }));

    expect(await screen.findByLabelText('Código de vínculo')).toHaveTextContent('K7P2QX');
    expect(screen.getByRole('button', { name: 'Generar otro código' })).toBeInTheDocument();
  });

  it('introducir el código de otra persona la añade a las que supervisas', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi(SIN_NADIE);
    renderizarPagina(<PaginaFamilia />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.type(await screen.findByLabelText('Código'), 'k7p2qx');
    await usuario.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/familia/vincular',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ codigo: 'K7P2QX' }) }),
    );
    expect(await screen.findByText('Tareas de Lucía')).toBeInTheDocument();
  });

  it('aprueba una tarea pendiente de revisión', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({ ...SIN_NADIE, supervisados: [HIJA] }, [tareaSupervisada({})]);
    renderizarPagina(<PaginaFamilia />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText('Por revisar (1)')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Aprobar' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/familia/tareas/tarea-1/revision',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ decision: 'APROBADA' }) }),
    );
    expect(await screen.findByText('No hay nada pendiente de revisar.')).toBeInTheDocument();
  });

  it('devolver una tarea exige escribir qué hay que corregir', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({ ...SIN_NADIE, supervisados: [HIJA] }, [tareaSupervisada({})]);
    renderizarPagina(<PaginaFamilia />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(await screen.findByRole('button', { name: 'Devolver' }));
    await usuario.type(screen.getByLabelText('¿Qué hay que corregir?'), 'Falta Saturno');
    await usuario.click(screen.getByRole('button', { name: 'Devolver con este comentario' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/familia/tareas/tarea-1/revision',
      expect.objectContaining({
        body: JSON.stringify({ decision: 'DEVUELTA', comentario: 'Falta Saturno' }),
      }),
    );
  });

  it('asigna una tarea nueva a la persona supervisada', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({ ...SIN_NADIE, supervisados: [HIJA] });
    renderizarPagina(<PaginaFamilia />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const formulario = within(await screen.findByRole('form', { name: 'Asignar una tarea' }));
    await usuario.type(formulario.getByLabelText('Tarea que quieres asignar'), 'Leer el capítulo 3');
    await usuario.click(formulario.getByRole('button', { name: 'Asignar' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/familia/supervisados/hija/tareas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ titulo: 'Leer el capítulo 3', ambito: 'ESCOLAR' }),
      }),
    );
    await waitFor(() => expect(screen.getByText('Leer el capítulo 3')).toBeInTheDocument());
  });
});
