import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaPomodoro } from './PaginaPomodoro';

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
    completadaEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

const estadoPomodoroBase = {
  fase: 'trabajo' as const,
  segundosRestantes: 1500,
  activo: false,
  ciclosCompletados: 0,
  notificacionPendiente: false,
  ultimaFaseCompletada: null,
  historial: [] as SesionPomodoro[],
};

describe('PaginaPomodoro', () => {
  it('empieza mostrando 25:00 en fase de trabajo, con el botón Iniciar', () => {
    renderizarPagina(<PaginaPomodoro />);

    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument();
  });

  it('al pulsar Iniciar, el botón pasa a Pausar', async () => {
    const usuario = userEvent.setup();
    renderizarPagina(<PaginaPomodoro />);

    await usuario.click(screen.getByRole('button', { name: 'Iniciar' }));

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar' })).not.toBeInTheDocument();
  });

  it('el desplegable de tarea asociada solo incluye tareas no completadas', () => {
    const tareas = [
      crearTareaFalsa({ id: 'pendiente', titulo: 'Tarea pendiente', estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'hecha', titulo: 'Tarea ya hecha', estado: 'HECHA' }),
    ];

    renderizarPagina(<PaginaPomodoro />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    const desplegable = screen.getByLabelText('Tarea asociada (opcional)');
    expect(within(desplegable).getByText('Tarea pendiente')).toBeInTheDocument();
    expect(within(desplegable).queryByText('Tarea ya hecha')).not.toBeInTheDocument();
  });

  it('sin sesiones, muestra el historial vacío', () => {
    renderizarPagina(<PaginaPomodoro />);

    expect(
      screen.getByText('Todavía no has completado ninguna sesión.'),
    ).toBeInTheDocument();
  });

  it('el historial reciente muestra la fase, la tarea asociada y los minutos', () => {
    const historial = [
      crearSesionFalsa({
        id: 'con-tarea',
        fase: 'TRABAJO',
        duracionSegundos: 1500,
        tarea: { id: 'tarea-1', titulo: 'Escribir informe' },
      }),
      crearSesionFalsa({ id: 'sin-tarea', fase: 'DESCANSO_CORTO', duracionSegundos: 300 }),
    ];

    renderizarPagina(<PaginaPomodoro />, {
      estadoPrecargado: { pomodoro: { ...estadoPomodoroBase, historial } },
    });

    expect(screen.getByText('Trabajo · Escribir informe')).toBeInTheDocument();
    expect(screen.getByText('25 min')).toBeInTheDocument();
    expect(screen.getByText('Descanso corto')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });
});
