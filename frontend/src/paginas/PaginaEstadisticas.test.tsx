import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina } from '@/pruebas/render';
import { descargarCsv } from '@/utilidades/exportar';
import { PaginaEstadisticas } from './PaginaEstadisticas';

vi.mock('@/utilidades/exportar', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('@/utilidades/exportar')>()),
  descargarCsv: vi.fn(),
}));

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

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

function crearSesionFalsa(datos: Partial<SesionPomodoro>): SesionPomodoro {
  return {
    id: 'sesion-1',
    fase: 'TRABAJO',
    duracionSegundos: 1500,
    usuarioId: 'usuario-1',
    tareaId: null,
    tarea: null,
    completadaEn: new Date().toISOString(),
    ...datos,
  };
}

describe('PaginaEstadisticas', () => {
  it('sin tareas ni sesiones, muestra los estados vacíos', () => {
    renderizarPagina(<PaginaEstadisticas />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(
      screen.getByText('Todavía no has completado ninguna sesión de trabajo.'),
    ).toBeInTheDocument();
  });

  it('calcula el progreso global a partir de las tareas precargadas', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', estado: 'HECHA' }),
      crearTareaFalsa({ id: 'b', estado: 'HECHA' }),
      crearTareaFalsa({ id: 'c', estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'd', estado: 'POR_HACER' }),
    ];

    renderizarPagina(<PaginaEstadisticas />, { estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } } });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('2 de 4 tareas')).toBeInTheDocument();
  });

  it('cuenta los pomodoros de hoy/esta semana e ignora los de hace más de una semana y los descansos', () => {
    const ahora = Date.now();
    const historial: SesionPomodoro[] = [
      crearSesionFalsa({ id: 'hoy', fase: 'TRABAJO', duracionSegundos: 1500 }),
      crearSesionFalsa({
        id: 'hace-3-dias',
        fase: 'TRABAJO',
        duracionSegundos: 1500,
        completadaEn: new Date(ahora - 3 * MILISEGUNDOS_POR_DIA).toISOString(),
      }),
      crearSesionFalsa({
        id: 'hace-10-dias',
        fase: 'TRABAJO',
        duracionSegundos: 1500,
        completadaEn: new Date(ahora - 10 * MILISEGUNDOS_POR_DIA).toISOString(),
      }),
      crearSesionFalsa({ id: 'descanso-hoy', fase: 'DESCANSO_CORTO', duracionSegundos: 300 }),
    ];

    renderizarPagina(<PaginaEstadisticas />, {
      estadoPrecargado: {
        pomodoro: {
          fase: 'trabajo',
          segundosRestantes: 1500,
          activo: false,
          ciclosCompletados: 0,
          notificacionPendiente: false,
          ultimaFaseCompletada: null,
          historial,
        },
      },
    });

    expect(screen.getByText('Pomodoro')).toBeInTheDocument();
    // Hoy: solo "hoy" (1). Esta semana: "hoy" + "hace-3-dias" (2). Minutos: 25+25=50.
    const numeros = screen.getAllByText(/^\d+$/).map((nodo) => nodo.textContent);
    expect(numeros).toEqual(expect.arrayContaining(['1', '2', '50']));
  });

  it('muestra la racha de días seguidos cuando hay una sesión de trabajo hoy', () => {
    const historial: SesionPomodoro[] = [crearSesionFalsa({ id: 'hoy', fase: 'TRABAJO' })];

    renderizarPagina(<PaginaEstadisticas />, {
      estadoPrecargado: {
        pomodoro: {
          fase: 'trabajo',
          segundosRestantes: 1500,
          activo: false,
          ciclosCompletados: 0,
          notificacionPendiente: false,
          ultimaFaseCompletada: null,
          historial,
        },
      },
    });

    expect(screen.getByText('Racha: 1 día seguido')).toBeInTheDocument();
  });

  it('sin sesiones recientes (aunque haya historial antiguo), muestra el mensaje de racha vacía', () => {
    const ahora = Date.now();
    const historial: SesionPomodoro[] = [
      crearSesionFalsa({
        id: 'hace-10-dias',
        fase: 'TRABAJO',
        completadaEn: new Date(ahora - 10 * MILISEGUNDOS_POR_DIA).toISOString(),
      }),
    ];

    renderizarPagina(<PaginaEstadisticas />, {
      estadoPrecargado: {
        pomodoro: {
          fase: 'trabajo',
          segundosRestantes: 1500,
          activo: false,
          ciclosCompletados: 0,
          notificacionPendiente: false,
          ultimaFaseCompletada: null,
          historial,
        },
      },
    });

    expect(
      screen.getByText('Aún no tienes una racha activa. ¡Empieza hoy!'),
    ).toBeInTheDocument();
  });

  it('muestra el mapa de actividad diaria', () => {
    renderizarPagina(<PaginaEstadisticas />);

    expect(screen.getByText('Actividad diaria')).toBeInTheDocument();
  });

  it('sin tareas con tiempo estimado, muestra el mensaje vacío de la comparación de tiempo', () => {
    renderizarPagina(<PaginaEstadisticas />);

    expect(
      screen.getByText(
        'Pon un tiempo estimado en una tarea (desde su detalle) y regístrale sesiones de Pomodoro para verla comparada aquí.',
      ),
    ).toBeInTheDocument();
  });

  it('con una tarea con tiempo estimado, compara el estimado contra el real registrado', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Escribir el informe', tiempoEstimadoMinutos: 30 }),
    ];
    const historial: SesionPomodoro[] = [
      crearSesionFalsa({ id: 's1', fase: 'TRABAJO', duracionSegundos: 1500, tareaId: 'a' }),
    ];

    renderizarPagina(<PaginaEstadisticas />, {
      estadoPrecargado: {
        tareas: { lista: tareas, cargando: false, error: null },
        pomodoro: {
          fase: 'trabajo',
          segundosRestantes: 1500,
          activo: false,
          ciclosCompletados: 0,
          notificacionPendiente: false,
          ultimaFaseCompletada: null,
          historial,
        },
      },
    });

    expect(screen.getByText('Escribir el informe')).toBeInTheDocument();
    expect(screen.getByText('Estimado: 30 min')).toBeInTheDocument();
    expect(screen.getByText('Real: 25 min')).toBeInTheDocument();
  });

  it('el botón "Exportar CSV" genera un archivo con las tareas', async () => {
    const usuario = userEvent.setup();
    const tareas = [crearTareaFalsa({ id: 'a', titulo: 'Tarea exportable' })];

    renderizarPagina(<PaginaEstadisticas />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    await usuario.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(descargarCsv).toHaveBeenCalledTimes(1);
    const [filas, nombreArchivo] = vi.mocked(descargarCsv).mock.calls[0];
    expect(filas.some((fila) => fila.includes('Tarea exportable'))).toBe(true);
    expect(nombreArchivo).toMatch(/^focusflow-tareas-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
