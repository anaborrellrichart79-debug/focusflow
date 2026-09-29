import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Tarea } from '@/servicios/tareas';
import { AsistenteIa } from './AsistenteIa';

const TAREA = {
  id: 'examen',
  titulo: 'Examen de fracciones',
  fechaLimite: '2026-10-02T00:00:00.000Z',
  ambito: 'ESCOLAR',
  objetivoId: null,
  asignaturaHorarioId: 'ah-mates',
  etiquetas: [{ id: 'e', nombre: 'Matemáticas', padreId: null }],
  subtareas: [],
} as unknown as Tarea;

function simularApi(respuestas: Record<string, unknown>) {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const ruta = Object.keys(respuestas).find((clave) => url.endsWith(clave));
    const cuerpo = ruta ? respuestas[ruta] : { id: 'nueva', ...JSON.parse((opciones?.body as string) ?? '{}') };
    return { ok: true, status: 200, json: async () => cuerpo } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

function llamadasA(fetchFalso: ReturnType<typeof simularApi>, sufijo: string) {
  return fetchFalso.mock.calls.filter(([url]) => (url as string).endsWith(sufijo));
}

describe('AsistenteIa', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('propone pasos editables y añade como subtareas solo los marcados, en orden', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({
      '/ia/subtareas': { pasos: ['Leer el tema 3', 'Hacer la ficha', 'Repasar errores'] },
    });
    renderizarPagina(<AsistenteIa tarea={TAREA} />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(screen.getByRole('button', { name: 'Dividir en pasos' }));
    const textos = await screen.findAllByRole('textbox', { name: 'Texto de la propuesta' });
    await usuario.clear(textos[0]);
    await usuario.type(textos[0], 'Leer el tema 3 entero');
    await usuario.click(screen.getByRole('checkbox', { name: 'Incluir «Hacer la ficha»' }));
    await usuario.click(screen.getByRole('button', { name: 'Añadir 2 subtareas' }));

    await waitFor(() => expect(llamadasA(fetchFalso, '/tareas/examen/subtareas')).toHaveLength(2));
    const titulos = llamadasA(fetchFalso, '/tareas/examen/subtareas').map(
      ([, opciones]) => JSON.parse(opciones!.body as string).titulo,
    );
    expect(titulos).toEqual(['Leer el tema 3 entero', 'Repasar errores']);
    expect(await screen.findByText('Se han añadido 2 elementos.')).toBeInTheDocument();
  });

  it('el plan de estudio crea una tarea por sesión con su fecha, asignatura y etiquetas', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({
      '/ia/plan-estudio': { sesiones: [{ fecha: '2026-09-30', titulo: 'Repasar el tema 3', minutos: 40 }] },
    });
    renderizarPagina(<AsistenteIa tarea={TAREA} />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(screen.getByRole('button', { name: 'Plan de estudio hasta la fecha' }));
    expect(await screen.findByText('40 min')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Añadir 1 sesión' }));

    await waitFor(() => expect(llamadasA(fetchFalso, '/tareas')).toHaveLength(1));
    expect(JSON.parse(llamadasA(fetchFalso, '/tareas')[0][1]!.body as string)).toMatchObject({
      titulo: 'Repasar el tema 3',
      fechaLimite: '2026-09-30T00:00:00.000Z',
      tiempoEstimadoMinutos: 40,
      ambito: 'ESCOLAR',
      asignaturaHorarioId: 'ah-mates',
      etiquetas: ['Matemáticas'],
    });
  });

  it('sin fecha límite no ofrece el plan; si la IA no está, lo dice', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: 'La IA local no está disponible ahora mismo', codigo: 'IA_NO_DISPONIBLE' }),
      }),
    );
    renderizarPagina(<AsistenteIa tarea={{ ...TAREA, fechaLimite: null }} />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.queryByRole('button', { name: 'Plan de estudio hasta la fecha' })).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Dividir en pasos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La IA local no está disponible ahora mismo');
  });
});
