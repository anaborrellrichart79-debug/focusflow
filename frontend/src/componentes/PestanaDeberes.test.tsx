import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaPlanificador } from '@/paginas/PaginaPlanificador';
import { crearHorarioFalso } from '@/pruebas/horarioFalso';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Tarea } from '@/servicios/tareas';

// Miércoles 30/09/2026. En el horario falso, Matemáticas solo es el lunes.
const AHORA = new Date(2026, 8, 30, 17, 0);
const LUNES = '2026-10-05';

function tarea(datos: Partial<Tarea>): Tarea {
  return {
    id: datos.titulo ?? 'tarea',
    titulo: 'Tarea',
    descripcion: null,
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    ambito: 'ESCOLAR',
    tipoEscolar: 'DEBERES',
    recurrencia: 'NINGUNA',
    tiempoEstimadoMinutos: null,
    subtareas: [],
    etiquetas: [],
    objetivoId: null,
    usuarioId: 'usuario-1',
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

// Al abrirse, la página vuelve a pedir las tareas y las etiquetas: las
// lecturas (GET) devuelven listas; crear una tarea devuelve la tarea creada.
function simularApi(respuestas: Record<string, unknown>, tareas: Tarea[] = []) {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const ruta = Object.keys(respuestas).find((clave) => url.endsWith(clave));
    const esLectura = !opciones?.method || opciones.method === 'GET';
    const cuerpo = ruta
      ? respuestas[ruta]
      : esLectura
        ? url.endsWith('/tareas')
          ? tareas
          : []
        : { ...tarea({}), id: 'nueva', ...JSON.parse((opciones?.body as string) ?? '{}') };
    return { ok: true, status: 200, json: async () => cuerpo } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

function creacionesEn(fetchFalso: ReturnType<typeof simularApi>, sufijo: string) {
  return fetchFalso.mock.calls.filter(([url, opciones]) => (url as string).endsWith(sufijo) && opciones?.method === 'POST');
}

function renderizar(tareas: Tarea[] = []) {
  return renderizarPagina(<PaginaPlanificador />, {
    ruta: '/planificador?pestana=deberes',
    estadoPrecargado: {
      sesion: SESION_AUTENTICADA,
      tareas: { lista: tareas, cargando: false, error: null },
      horario: { cursos: [], lista: [], activo: crearHorarioFalso(), cargado: true, guardando: false, error: null },
    },
  });
}

const RESPUESTAS_BASE = {
  '/calendario-escolar': { periodos: [], propios: [] },
  '/planes/ia': { incluida: true, origen: 'FAMILIA', usados: 0, limite: 100 },
};

describe('Planificador · pestaña Deberes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('separa los deberes de los exámenes y los agrupa por día de entrega', async () => {
    const tareas = [
      tarea({ titulo: 'Ficha de sumas', fechaLimite: '2026-10-01T00:00:00.000Z' }),
      tarea({ titulo: 'Lectura atrasada', fechaLimite: '2026-09-28T00:00:00.000Z' }),
      tarea({ titulo: 'Examen de mates', tipoEscolar: 'EXAMEN', fechaLimite: '2026-10-01T00:00:00.000Z' }),
    ];
    simularApi(RESPUESTAS_BASE, tareas);
    renderizar(tareas);

    const manana = (await screen.findByText('Para mañana')).closest('[data-slot="card"]') as HTMLElement;
    expect(within(manana).getByText('Ficha de sumas')).toBeInTheDocument();
    const atrasados = screen.getByText('Atrasados').closest('[data-slot="card"]') as HTMLElement;
    expect(within(atrasados).getByText('Lectura atrasada')).toBeInTheDocument();
    expect(screen.queryByText('Examen de mates')).not.toBeInTheDocument();

    // En la otra pestaña, al revés.
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Exámenes y trabajos' }));
    expect(await screen.findByText('Examen de mates')).toBeInTheDocument();
    expect(screen.queryByText('Ficha de sumas')).not.toBeInTheDocument();
  });

  it('al apuntar, la fecha es la próxima clase de la asignatura y se crea como deberes', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi(RESPUESTAS_BASE);
    renderizar();

    fireEvent.change(await screen.findByLabelText('Asignatura'), { target: { value: 'ah-mates' } });
    expect(screen.getByLabelText('Para el')).toHaveValue(LUNES);
    await usuario.type(screen.getByLabelText('Qué hay que hacer'), 'Página 34, ejercicios 1 a 5');
    await usuario.click(screen.getByRole('button', { name: 'Apuntar' }));

    await waitFor(() => expect(creacionesEn(fetchFalso, '/tareas')).toHaveLength(1));
    expect(JSON.parse(creacionesEn(fetchFalso, '/tareas')[0][1]!.body as string)).toMatchObject({
      titulo: 'Página 34, ejercicios 1 a 5',
      fechaLimite: LUNES,
      ambito: 'ESCOLAR',
      tipoEscolar: 'DEBERES',
      asignaturaHorarioId: 'ah-mates',
    });
  });

  it('lee los deberes de una foto de la agenda y, si no dice la fecha, pone la próxima clase', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({
      ...RESPUESTAS_BASE,
      '/ia/fotos/deberes': {
        deberes: [
          { titulo: 'Página 34, ejercicios 1 a 5', fecha: null, asignaturaHorarioId: 'ah-mates' },
          { titulo: 'Traer la autorización', fecha: '2026-10-02', asignaturaHorarioId: null },
        ],
      },
    });
    renderizar();

    await usuario.upload(
      await screen.findByLabelText('Hacer o elegir una foto'),
      new File(['foto'], 'agenda.jpg', { type: 'image/jpeg' }),
    );

    await screen.findByRole('button', { name: 'Añadir 2 deberes' });
    const fechas = await screen.findAllByLabelText('Para el');
    // La primera fecha es la del formulario de apuntar; las de la foto van después.
    const valores = fechas.map((campo) => (campo as HTMLInputElement).value);
    expect(valores).toContain(LUNES);
    expect(valores).toContain('2026-10-02');

    await usuario.click(screen.getByRole('button', { name: 'Añadir 2 deberes' }));

    await waitFor(() => expect(creacionesEn(fetchFalso, '/tareas')).toHaveLength(2));
    expect(JSON.parse(creacionesEn(fetchFalso, '/tareas')[0][1]!.body as string)).toMatchObject({
      fechaLimite: LUNES,
      tipoEscolar: 'DEBERES',
      asignaturaHorarioId: 'ah-mates',
    });
    expect(await screen.findByText('Se han añadido 2 deberes.')).toBeInTheDocument();
  });
});
