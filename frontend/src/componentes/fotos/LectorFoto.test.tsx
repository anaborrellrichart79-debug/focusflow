import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Horario } from '@/servicios/horarios';
import { LectorFotoEntregas } from './LectorFotoEntregas';
import { LectorFotoHorario } from './LectorFotoHorario';

const CON_IA = { incluida: true, origen: 'FAMILIA', usados: 0, limite: 100 };
const FOTO = new File(['foto'], 'horario.jpg', { type: 'image/jpeg' });

const HORARIO = {
  id: 'horario-1',
  titulo: '4.º B',
  asignaturas: [{ id: 'ah-mates', color: '#3B82F6', asignatura: { nombre: 'Matemáticas' } }],
  franjas: [],
  sesiones: [],
} as unknown as Horario;

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

describe('LectorFotoHorario', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sube la foto, enseña la cuadrícula leída y al aplicarla sustituye la del horario', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({
      '/planes/ia': CON_IA,
      '/ia/fotos/horario/horario-1': {
        franjas: [
          {
            horaInicio: '09:00',
            horaFin: '10:00',
            tipo: 'CLASE',
            etiqueta: '',
            clases: [{ diaSemana: 1, asignaturaId: 'primaria-4-matematicas', nombre: 'Matemáticas' }],
          },
          { horaInicio: '10:00', horaFin: '10:30', tipo: 'DESCANSO', etiqueta: 'Patio', clases: [] },
        ],
      },
      '/horarios/horario-1/cuadricula': { ...HORARIO, curso: { id: 'primaria-4' } },
    });
    renderizarPagina(<LectorFotoHorario horario={HORARIO} />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.upload(await screen.findByLabelText('Hacer o elegir una foto'), FOTO);

    expect(await screen.findByText('Patio')).toBeInTheDocument();
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
    const [, subida] = llamadasA(fetchFalso, '/ia/fotos/horario/horario-1')[0];
    expect(subida!.body).toBeInstanceOf(FormData);
    // Con un formulario no se fuerza el Content-Type JSON.
    expect((subida!.headers as Record<string, string>)['Content-Type']).toBeUndefined();

    await usuario.click(screen.getByRole('button', { name: 'Aplicar al horario' }));

    expect(await screen.findByText('Horario actualizado a partir de la foto.')).toBeInTheDocument();
    const [, aplicar] = llamadasA(fetchFalso, '/horarios/horario-1/cuadricula')[0];
    expect(aplicar!.method).toBe('PUT');
    expect(JSON.parse(aplicar!.body as string)).toEqual({
      franjas: [
        {
          horaInicio: '09:00',
          horaFin: '10:00',
          tipo: 'CLASE',
          clases: [{ diaSemana: 1, asignaturaId: 'primaria-4-matematicas' }],
        },
        { horaInicio: '10:00', horaFin: '10:30', tipo: 'DESCANSO', etiqueta: 'Patio', clases: [] },
      ],
    });
  });

  it('con el plan gratuito no ofrece leer la foto', async () => {
    simularApi({ '/planes/ia': { incluida: false, origen: null, usados: 0, limite: 100 } });
    renderizarPagina(<LectorFotoHorario horario={HORARIO} />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(await screen.findByText(/está incluido en el plan Plus/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Hacer o elegir una foto')).not.toBeInTheDocument();
  });
});

describe('LectorFotoEntregas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('propone las entregas de la foto, deja corregirlas y crea solo las marcadas como tareas escolares', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi({
      '/planes/ia': CON_IA,
      '/ia/fotos/entregas': {
        entregas: [
          { fecha: '2026-10-06', titulo: 'Examen de las tablas', tipo: 'EXAMEN', asignaturaHorarioId: 'ah-mates' },
          { fecha: '2026-10-20', titulo: 'Excursión', tipo: 'TRABAJO', asignaturaHorarioId: null },
        ],
      },
    });
    renderizarPagina(<LectorFotoEntregas />, {
      estadoPrecargado: {
        sesion: SESION_AUTENTICADA,
        horario: { activo: HORARIO } as never,
      },
    });

    await usuario.upload(await screen.findByLabelText('Hacer o elegir una foto'), FOTO);

    const titulos = await screen.findAllByRole('textbox', { name: 'Título' });
    await usuario.clear(titulos[0]);
    await usuario.type(titulos[0], 'Examen de Matemáticas: las tablas');
    await usuario.click(screen.getByRole('checkbox', { name: 'Incluir «Excursión»' }));
    await usuario.click(screen.getByRole('button', { name: 'Añadir 1 entrega' }));

    await waitFor(() => expect(llamadasA(fetchFalso, '/tareas')).toHaveLength(1));
    expect(JSON.parse(llamadasA(fetchFalso, '/tareas')[0][1]!.body as string)).toMatchObject({
      titulo: 'Examen de Matemáticas: las tablas',
      fechaLimite: '2026-10-06',
      ambito: 'ESCOLAR',
      tipoEscolar: 'EXAMEN',
      asignaturaHorarioId: 'ah-mates',
    });
    expect(await screen.findByText('Se ha añadido 1 entrega.')).toBeInTheDocument();
  });

  it('si la IA no encuentra nada, lo dice', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/planes/ia')
          ? ({ ok: true, status: 200, json: async () => CON_IA } as Response)
          : ({
              ok: false,
              status: 502,
              json: async () => ({
                message: 'La IA no ha dado una propuesta válida, inténtalo de nuevo',
                codigo: 'IA_RESPUESTA_NO_VALIDA',
              }),
            } as Response),
      ),
    );
    renderizarPagina(<LectorFotoEntregas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.upload(await screen.findByLabelText('Hacer o elegir una foto'), FOTO);

    expect(await screen.findByRole('alert')).toHaveTextContent(/propuesta válida/);
  });
});
