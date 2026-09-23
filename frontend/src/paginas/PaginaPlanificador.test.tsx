import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Tarea } from '@/servicios/tareas';
import { PaginaPlanificador } from './PaginaPlanificador';

function crearTareaFalsa(datos: Partial<Tarea>): Tarea {
  return {
    id: 'tarea-1',
    titulo: 'Tarea de prueba',
    descripcion: null,
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    ambito: 'ESCOLAR',
    tipoEscolar: 'EXAMEN',
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

function seccion(titulo: RegExp) {
  const encabezado = screen.getByText(titulo);
  const tarjeta = encabezado.closest('[data-slot="card"]');
  if (!tarjeta) throw new Error(`No se encontró la sección ${titulo}`);
  return within(tarjeta as HTMLElement);
}

describe('PaginaPlanificador', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sin entregas, muestra el mensaje vacío', () => {
    renderizarPagina(<PaginaPlanificador />);

    expect(
      screen.getByText(
        'No tienes exámenes, trabajos ni presentaciones pendientes. ¡Añade el primero!',
      ),
    ).toBeInTheDocument();
  });

  it('reparte las entregas por fecha y muestra su tipo', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Examen de mates', fechaLimite: '2026-06-17T12:00:00.000Z' }),
      crearTareaFalsa({
        id: 'b',
        titulo: 'Trabajo de historia',
        tipoEscolar: 'TRABAJO',
        fechaLimite: '2026-07-20T12:00:00.000Z',
      }),
      crearTareaFalsa({ id: 'c', titulo: 'Compra', ambito: 'PERSONAL', tipoEscolar: null }),
    ];

    renderizarPagina(<PaginaPlanificador />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(seccion(/Próximos 7 días/).getByText('Examen de mates')).toBeInTheDocument();
    expect(seccion(/Próximos 7 días/).getByText('Examen')).toBeInTheDocument();
    expect(seccion(/Más adelante/).getByText('Trabajo de historia')).toBeInTheDocument();
    expect(screen.queryByText('Compra')).not.toBeInTheDocument();
    // Las secciones opcionales vacías no se muestran.
    expect(screen.queryByText(/Vencidas/)).not.toBeInTheDocument();
  });

  it('muestra las escolares aunque el ámbito activo de la barra lateral sea Personal', () => {
    renderizarPagina(<PaginaPlanificador />, {
      estadoPrecargado: {
        interfaz: { idioma: 'es', tema: 'claro', ambitoActivo: 'PERSONAL' },
        tareas: {
          lista: [crearTareaFalsa({ titulo: 'Examen de física' })],
          cargando: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('Examen de física')).toBeInTheDocument();
  });

  it('el filtro por tipo deja solo las entregas de ese tipo', async () => {
    const usuario = userEvent.setup();
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Examen de mates' }),
      crearTareaFalsa({ id: 'b', titulo: 'Exposición de inglés', tipoEscolar: 'PRESENTACION' }),
    ];

    renderizarPagina(<PaginaPlanificador />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    await usuario.click(screen.getByRole('button', { name: /Presentaciones/ }));

    expect(screen.getByText('Exposición de inglés')).toBeInTheDocument();
    expect(screen.queryByText('Examen de mates')).not.toBeInTheDocument();
  });

  it('añadir una entrega la crea como escolar, con su tipo, fecha y asignatura como etiqueta', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, opciones?: RequestInit) => {
        if (url.endsWith('/tareas') && opciones?.method === 'POST') {
          return { ok: true, json: async () => crearTareaFalsa({ id: 'nueva' }) } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      }),
    );

    renderizarPagina(<PaginaPlanificador />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.type(screen.getByLabelText('p. ej. Examen del tema 3'), 'Trabajo de biología');
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'TRABAJO' } });
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '2026-06-20' } });
    await usuario.type(screen.getByLabelText('Asignatura (opcional)'), 'Biología');
    await usuario.click(screen.getByRole('button', { name: 'Añadir al planificador' }));

    const llamadaPost = vi
      .mocked(fetch)
      .mock.calls.find(([, opciones]) => opciones?.method === 'POST');
    expect(JSON.parse(llamadaPost![1]!.body as string)).toEqual({
      titulo: 'Trabajo de biología',
      fechaLimite: '2026-06-20',
      ambito: 'ESCOLAR',
      tipoEscolar: 'TRABAJO',
      etiquetas: ['Biología'],
    });
  });
});
