import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectorAmbito } from '@/componentes/SelectorAmbito';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import { PaginaKanban } from './PaginaKanban';

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
    ambito: 'PERSONAL',
    tipoEscolar: null,
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

function obtenerColumna(nombre: string) {
  const titulo = screen.getByText(nombre);
  const card = titulo.closest('[data-slot="card"]');
  if (!card) throw new Error(`No se encontró la columna "${nombre}"`);
  return within(card as HTMLElement);
}

describe('PaginaKanban', () => {
  it('reparte las tareas en su columna según el estado', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Por hacer 1', estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'b', titulo: 'En proceso 1', estado: 'EN_PROCESO' }),
      crearTareaFalsa({ id: 'c', titulo: 'Hecha 1', estado: 'HECHA' }),
    ];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(obtenerColumna('Por hacer').getByText('Por hacer 1')).toBeInTheDocument();
    expect(obtenerColumna('En progreso').getByText('En proceso 1')).toBeInTheDocument();
    expect(obtenerColumna('Hecha').getByText('Hecha 1')).toBeInTheDocument();

    expect(obtenerColumna('Por hacer').queryByText('En proceso 1')).not.toBeInTheDocument();
  });

  it('tiene una columna por estado, y las archivadas solo aparecen en la suya', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Encarrilada', estado: 'BAJO_CONTROL' }),
      crearTareaFalsa({ id: 'b', titulo: 'Aparcada', estado: 'POSPUESTA' }),
      crearTareaFalsa({ id: 'c', titulo: 'Vieja', estado: 'ARCHIVADA' }),
    ];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(obtenerColumna('Bajo control').getByText('Encarrilada')).toBeInTheDocument();
    expect(obtenerColumna('Pospuesta').getByText('Aparcada')).toBeInTheDocument();
    expect(obtenerColumna('Archivada').getByText('Vieja')).toBeInTheDocument();
    expect(screen.getAllByText('Vieja')).toHaveLength(1);
  });

  it('en la primera columna, el botón de mover a la anterior está deshabilitado', () => {
    const tareas = [crearTareaFalsa({ id: 'a', titulo: 'Sola', estado: 'POR_HACER' })];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(screen.getByRole('button', { name: 'Mover a la columna anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mover a la columna siguiente' })).toBeEnabled();
  });

  it('muestra la etiqueta del objetivo al que pertenece la tarea', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Con objetivo', objetivoId: 'objetivo-1' }),
    ];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: {
        tareas: { lista: tareas, cargando: false, error: null },
        objetivos: {
          lista: [
            {
              id: 'objetivo-1',
              titulo: 'Mi objetivo',
              descripcion: null,
              fechaLimite: null,
              ambito: 'PERSONAL',
              totalTareas: 1,
              tareasCompletadas: 0,
              creadoEn: '2026-01-01T00:00:00.000Z',
              actualizadoEn: '2026-01-01T00:00:00.000Z',
            },
          ],
          cargando: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('Mi objetivo')).toBeInTheDocument();
  });

  describe('filtro por ámbito', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('al elegir "Escolar" en el selector, oculta las tareas personales', async () => {
      const usuario = userEvent.setup();
      const tareas = [
        crearTareaFalsa({ id: 'a', titulo: 'Hacer la compra', ambito: 'PERSONAL' }),
        crearTareaFalsa({ id: 'b', titulo: 'Examen de mates', ambito: 'ESCOLAR' }),
      ];

      renderizarPagina(
        <>
          <SelectorAmbito />
          <PaginaKanban />
        </>,
        {
          estadoPrecargado: {
            sesion: SESION_MODO_ESCOLAR,
            tareas: { lista: tareas, cargando: false, error: null },
          },
        },
      );

      expect(screen.getByText('Hacer la compra')).toBeInTheDocument();
      expect(screen.getByText('Examen de mates')).toBeInTheDocument();

      await usuario.click(screen.getByRole('button', { name: 'Escolar' }));

      expect(screen.queryByText('Hacer la compra')).not.toBeInTheDocument();
      expect(screen.getByText('Examen de mates')).toBeInTheDocument();
    });

    it('una tarea creada con el ámbito "Escolar" activo se envía como escolar', async () => {
      const usuario = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, opciones?: RequestInit) => {
          if (url.endsWith('/tareas') && opciones?.method === 'POST') {
            return {
              ok: true,
              json: async () =>
                crearTareaFalsa({ id: 'nueva', ...JSON.parse(opciones.body as string) }),
            } as Response;
          }
          return { ok: true, json: async () => [] } as Response;
        }),
      );

      renderizarPagina(<PaginaKanban />, {
        estadoPrecargado: {
          sesion: SESION_MODO_ESCOLAR,
          interfaz: { idioma: 'es', tema: 'claro', ambitoActivo: 'ESCOLAR' },
        },
      });

      await usuario.type(screen.getByPlaceholderText('Nueva tarea'), 'Trabajo de historia');
      await usuario.click(screen.getByRole('button', { name: 'Añadir' }));

      const llamadaPost = vi
        .mocked(fetch)
        .mock.calls.find(([, opciones]) => opciones?.method === 'POST');
      expect(JSON.parse(llamadaPost![1]!.body as string)).toMatchObject({
        titulo: 'Trabajo de historia',
        ambito: 'ESCOLAR',
      });
      expect(await screen.findByText('Trabajo de historia')).toBeInTheDocument();
    });
  });
});
