import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CURSO_TERCERO_PRIMARIA,
  LENGUA,
  MATEMATICAS,
  VALENCIANO,
  crearHorarioFalso,
} from '@/pruebas/horarioFalso';
import { renderizarPagina, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import type { Horario } from '@/servicios/horarios';
import { PaginaHorario } from './PaginaHorario';

function respuesta(cuerpo: unknown) {
  return { ok: true, status: 200, json: async () => cuerpo } as Response;
}

// Simula el backend: devuelve el horario indicado en las cargas iniciales y
// deja que cada test decida qué responder a las peticiones de escritura.
function simularApi(horario: Horario | null, escritura?: (url: string, opciones: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, opciones: RequestInit = {}) => {
      if (opciones.method && opciones.method !== 'GET' && escritura) {
        return respuesta(escritura(url, opciones));
      }
      if (url.endsWith('/horarios/activo')) return respuesta(horario);
      if (url.endsWith('/horarios')) return respuesta(horario ? [horario] : []);
      if (url.endsWith('/cursos')) return respuesta([CURSO_TERCERO_PRIMARIA]);
      if (url.includes('/asignaturas?comunidad=')) return respuesta([MATEMATICAS, LENGUA, VALENCIANO]);
      return respuesta(null);
    }),
  );
}

describe('PaginaHorario', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pinta el horario como una cuadrícula de lunes a viernes, con el recreo a lo ancho', async () => {
    simularApi(crearHorarioFalso());

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });

    expect(await screen.findByText('3º B')).toBeInTheDocument();
    expect(screen.getByText(/3º de Primaria · Curso 26\/27 · Comunitat Valenciana/)).toBeInTheDocument();
    for (const dia of ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']) {
      expect(screen.getByRole('columnheader', { name: dia })).toBeInTheDocument();
    }
    expect(screen.getByRole('rowheader', { name: '08:30 – 09:30' })).toBeInTheDocument();

    const recreo = screen.getByText('Recreo');
    expect(recreo.closest('td')).toHaveAttribute('colspan', '5');

    const mates = screen.getByText('Matemáticas').closest('td')!;
    expect(mates).toHaveStyle({ backgroundColor: '#3B82F6' });
    expect(within(mates).getByText('12')).toBeInTheDocument(); // aula
  });

  it('sin horario, pide crear uno con curso y comunidad', async () => {
    const usuario = userEvent.setup();
    const creado = crearHorarioFalso({ sesiones: [], asignaturas: [] });
    simularApi(null, (url, opciones) => {
      if (url.endsWith('/horarios') && opciones.method === 'POST') return creado;
      return null;
    });

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });

    expect(await screen.findByText('Crea tu horario de clase')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Grupo'), '3º B');
    await usuario.selectOptions(screen.getByLabelText('Curso'), 'primaria-3');
    await usuario.selectOptions(screen.getByLabelText('Comunidad autónoma'), 'COMUNITAT_VALENCIANA');
    await usuario.click(screen.getByRole('button', { name: 'Crear horario' }));

    const llamada = vi.mocked(fetch).mock.calls.find(([, opciones]) => opciones?.method === 'POST');
    expect(JSON.parse(llamada![1]!.body as string)).toMatchObject({
      titulo: '3º B',
      cursoId: 'primaria-3',
      comunidad: 'COMUNITAT_VALENCIANA',
    });
    expect(await screen.findByRole('columnheader', { name: 'lunes' })).toBeInTheDocument();
  });

  it('en modo edición, pulsar una casilla vacía y elegir asignatura la guarda', async () => {
    const usuario = userEvent.setup();
    const horario = crearHorarioFalso();
    simularApi(horario, () => horario);

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });

    await usuario.click(await screen.findByRole('button', { name: 'Editar' }));
    await usuario.click(screen.getByRole('button', { name: 'martes, 09:30: vacía' }));

    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('radio', { name: 'Lengua Castellana y Literatura' }));
    await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    const llamada = vi.mocked(fetch).mock.calls.find(([, opciones]) => opciones?.method === 'PUT');
    expect(llamada![0]).toBe('http://localhost:3000/horarios/horario-1/sesiones');
    expect(JSON.parse(llamada![1]!.body as string)).toEqual({
      franjaId: 'franja-2',
      diaSemana: 2,
      asignaturaHorarioId: 'ah-lengua',
      aula: '',
    });
  });

  it('el catálogo ofrece la lengua de la comunidad y no las asignaturas que ya están en el horario', async () => {
    const usuario = userEvent.setup();
    simularApi(crearHorarioFalso());

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }));

    const catalogo = screen.getByRole('combobox', { name: 'Añadir del currículo…' });
    expect(
      await within(catalogo).findByRole('option', { name: 'Valenciano: Lengua y Literatura' }),
    ).toBeInTheDocument();
    expect(within(catalogo).queryByRole('option', { name: 'Matemáticas' })).not.toBeInTheDocument();
    expect(within(catalogo).getByRole('group', { name: 'Lengua de la comunidad' })).toBeInTheDocument();
  });

  it('añadir una optativa propia la crea en el curso del horario y la añade al horario', async () => {
    const usuario = userEvent.setup();
    const horario = crearHorarioFalso();
    const ajedrez = { ...MATEMATICAS, id: 'propia-1', nombre: 'Ajedrez', categoria: 'OPTATIVA', usuarioId: 'usuario-1' };
    simularApi(horario, (url) => (url.endsWith('/asignaturas') && !url.includes('/horarios/') ? ajedrez : horario));

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }));

    await usuario.type(
      screen.getByLabelText('Otra asignatura u optativa (p. ej. Ajedrez)'),
      'Ajedrez',
    );
    const formulario = screen.getByLabelText('Otra asignatura u optativa (p. ej. Ajedrez)').closest('form')!;
    await usuario.click(within(formulario).getByRole('button', { name: 'Añadir' }));

    const posts = vi.mocked(fetch).mock.calls.filter(([, opciones]) => opciones?.method === 'POST');
    expect(posts[0][0]).toBe('http://localhost:3000/asignaturas');
    expect(JSON.parse(posts[0][1]!.body as string)).toEqual({ nombre: 'Ajedrez', cursoId: 'primaria-3' });
    expect(posts[1][0]).toBe('http://localhost:3000/horarios/horario-1/asignaturas');
    expect(JSON.parse(posts[1][1]!.body as string)).toEqual({ asignaturaId: 'propia-1' });
  });

  it('el editor de franjas permite un segundo recreo y lo guarda todo de una vez', async () => {
    const usuario = userEvent.setup();
    const horario = crearHorarioFalso();
    simularApi(horario, () => horario);

    renderizarPagina(<PaginaHorario />, { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } });
    await usuario.click(await screen.findByRole('button', { name: 'Editar' }));

    await usuario.click(screen.getByRole('button', { name: '+ Descanso' }));
    await usuario.click(screen.getByRole('button', { name: 'Guardar horas' }));

    const llamada = vi.mocked(fetch).mock.calls.find(([url, opciones]) =>
      String(url).endsWith('/franjas') && opciones?.method === 'PUT',
    );
    const { franjas } = JSON.parse(llamada![1]!.body as string);
    expect(franjas).toHaveLength(4);
    expect(franjas[3]).toEqual({ horaInicio: '11:00', horaFin: '11:30', tipo: 'DESCANSO', etiqueta: 'Recreo' });
    expect(franjas[0]).toMatchObject({ id: 'franja-1' });
  });
});
