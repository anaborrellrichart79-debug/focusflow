import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Etiqueta } from '@/servicios/etiquetas';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Tarea } from '@/servicios/tareas';
import { TiempoPorCategoria } from './TiempoPorCategoria';

const HACE_UN_RATO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function sesion(id: string, tareaId: string | null, minutos: number): SesionPomodoro {
  return { id, fase: 'TRABAJO', duracionSegundos: minutos * 60, tareaId, tarea: null, completadaEn: HACE_UN_RATO } as SesionPomodoro;
}

const MATES = { id: 'mates', nombre: 'Matemáticas', padreId: null } as Etiqueta;

const TAREAS = [
  {
    id: 'examen',
    ambito: 'ESCOLAR',
    estado: 'EN_PROCESO',
    etiquetas: [MATES],
    asignaturaHorario: { id: 'ah', color: '#e11d48', asignatura: { nombre: 'Matemáticas' } },
  },
  { id: 'lectura', ambito: 'ESCOLAR', estado: 'EN_PROCESO', etiquetas: [], asignaturaHorario: null },
] as unknown as Tarea[];

function renderizar(modoEscolarActivo: boolean) {
  return renderizarPagina(<TiempoPorCategoria />, {
    estadoPrecargado: {
      sesion: { ...SESION_AUTENTICADA, usuario: { ...SESION_AUTENTICADA.usuario!, modoEscolarActivo } },
      tareas: { lista: TAREAS, cargando: false, error: null },
      etiquetas: { lista: [MATES], cargando: false, error: null } as never,
      pomodoro: {
        fase: 'trabajo',
        segundosRestantes: 1500,
        activo: false,
        ciclosCompletados: 0,
        notificacionPendiente: false,
        ultimaFaseCompletada: null,
        // 3 h de Matemáticas, 20 min sin etiqueta y 25 min sin tarea.
        historial: [
          ...Array.from({ length: 6 }, (_, i) => sesion(`m${i}`, 'examen', 30)),
          sesion('l', 'lectura', 20),
          sesion('suelto', null, 25),
        ],
      },
    },
  });
}

describe('TiempoPorCategoria', () => {
  it('reparte el tiempo por etiqueta, con horas y minutos', () => {
    renderizar(false);

    expect(screen.getByText('Tiempo de concentración por etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Total de concentración: 3 h 45 min.')).toBeInTheDocument();
    const fila = screen.getByText('Matemáticas').closest('li')!;
    expect(within(fila).getByText('3 h 0 min')).toBeInTheDocument();
    expect(screen.getByText('Tareas sin etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Pomodoros sin tarea')).toBeInTheDocument();
    // Sin modo escolar no se ofrece agrupar por asignatura.
    expect(screen.queryByRole('button', { name: 'Asignaturas' })).not.toBeInTheDocument();
  });

  it('con el modo escolar se puede agrupar por asignatura', async () => {
    const usuario = userEvent.setup();
    renderizar(true);

    await usuario.click(screen.getByRole('button', { name: 'Asignaturas' }));

    expect(screen.getByText('Tiempo de concentración por asignatura')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Asignaturas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Tareas sin asignatura')).toBeInTheDocument();
  });
});
