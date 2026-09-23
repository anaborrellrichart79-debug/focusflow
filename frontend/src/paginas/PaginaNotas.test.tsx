import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Nota } from '@/servicios/notas';
import type { Tarea } from '@/servicios/tareas';
import { PaginaNotas } from './PaginaNotas';

function nota(datos: Partial<Nota>): Nota {
  return {
    id: 'n-1',
    tipo: 'NOTA',
    contenido: 'Idea',
    conCasilla: false,
    completada: false,
    tareaId: null,
    tarea: null,
    objetivoId: null,
    objetivo: null,
    creadoEn: '2026-09-23T10:00:00.000Z',
    actualizadoEn: '2026-09-23T10:00:00.000Z',
    ...datos,
  };
}

const MAQUETA = { id: 'tarea-1', titulo: 'Maqueta', estado: 'POR_HACER' } as Tarea;

const NOTAS = [
  nota({ id: 'n-1', contenido: 'Usar bolas de corcho', tareaId: 'tarea-1', tarea: { id: 'tarea-1', titulo: 'Maqueta' } }),
  nota({ id: 'n-2', contenido: 'Idea suelta' }),
  nota({ id: 't-1', tipo: 'TODO', contenido: 'Comprar cartulina', conCasilla: true }),
];

function simularApi() {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const cuerpo = opciones?.body ? JSON.parse(opciones.body as string) : null;
    let respuesta: unknown = [];
    if (url.endsWith('/notas') && opciones?.method === 'POST') {
      respuesta = nota({
        id: 'nueva',
        ...cuerpo,
        conCasilla: cuerpo.tipo === 'TODO' || Boolean(cuerpo.conCasilla),
        tarea: cuerpo.tareaId ? { id: cuerpo.tareaId, titulo: 'Maqueta' } : null,
      });
    } else if (url.includes('/notas/') && opciones?.method === 'PATCH') {
      respuesta = { ...NOTAS.find((n) => url.endsWith(n.id)), ...cuerpo };
    } else if (url.endsWith('/notas')) {
      respuesta = NOTAS;
    } else if (url.endsWith('/tareas')) {
      respuesta = [MAQUETA];
    }
    return { ok: true, json: async () => respuesta } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('PaginaNotas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('separa notas y to-dos en dos pestañas', async () => {
    const usuario = userEvent.setup();
    simularApi();
    renderizarPagina(<PaginaNotas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByDisplayValue('Idea suelta')).toBeInTheDocument();
    expect(screen.getByText('Tarea: Maqueta')).toBeInTheDocument();
    expect(screen.queryByText('Comprar cartulina')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('tab', { name: /To-Do/ }));

    expect(screen.getByText('Comprar cartulina')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Idea suelta')).not.toBeInTheDocument();
  });

  it('crea una nota con casilla asociada a una tarea', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaNotas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const formulario = within(await screen.findByRole('form', { name: 'Nueva nota' }));
    await usuario.type(formulario.getByRole('textbox', { name: 'Nueva nota' }), 'Pegar con cola blanca');
    await usuario.selectOptions(formulario.getByRole('combobox'), 'tarea:tarea-1');
    await usuario.click(formulario.getByRole('checkbox', { name: 'Con casilla' }));
    await usuario.click(formulario.getByRole('button', { name: 'Añadir' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/notas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          tipo: 'NOTA',
          contenido: 'Pegar con cola blanca',
          conCasilla: true,
          tareaId: 'tarea-1',
        }),
      }),
    );
  });

  it('marcar un to-do lo guarda en el servidor', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaNotas />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/notas?pestana=todo',
    });

    await usuario.click(await screen.findByRole('checkbox', { name: 'Marcar «Comprar cartulina»' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/notas/t-1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ completada: true }) }),
    );
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Marcar «Comprar cartulina»' })).toBeChecked(),
    );
  });

  it('con ?tarea= enseña solo lo de esa tarea', async () => {
    simularApi();
    renderizarPagina(<PaginaNotas />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/notas?tarea=tarea-1',
    });

    expect(await screen.findByDisplayValue('Usar bolas de corcho')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Idea suelta')).not.toBeInTheDocument();
  });
});
