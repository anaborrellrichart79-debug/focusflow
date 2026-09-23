import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearHorarioFalso } from '@/pruebas/horarioFalso';
import { renderizarPagina, SESION_AUTENTICADA, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import type { AmbitoActivo } from '@/almacen/interfazSlice';
import type { Tarea } from '@/servicios/tareas';
import { PaginaAgenda } from './PaginaAgenda';

// 2026-06-17 es miércoles; se fija como "hoy" para que la semana/mes mostrados
// por defecto sean predecibles en el test.
const AHORA = '2026-06-17T10:00:00.000Z';

function crearTareaFalsa(datos: Partial<Tarea> & { id: string }): Tarea {
  return {
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
    objetivoId: null,
    usuarioId: 'usuario-1',
    subtareas: [],
    etiquetas: [],
    creadoEn: '2026-06-01T00:00:00.000Z',
    actualizadoEn: '2026-06-01T00:00:00.000Z',
    ...datos,
  };
}

describe('PaginaAgenda', () => {
  beforeEach(() => {
    // Solo se falsea `Date`, no los temporizadores (setTimeout/setInterval):
    // si se falsean también estos últimos, el planificador de React se queda
    // colgado esperando un "tick" que nunca llega, y cualquier test que haga
    // click con userEvent hace timeout.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(AHORA));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('en la vista de semana (por defecto) reparte las tareas en su día correspondiente', () => {
    const tareas = [
      crearTareaFalsa({ id: 'lunes', titulo: 'Tarea del lunes', fechaLimite: '2026-06-15T09:00:00.000Z' }),
      crearTareaFalsa({ id: 'miercoles', titulo: 'Tarea de hoy', fechaLimite: '2026-06-17T09:00:00.000Z' }),
    ];

    renderizarPagina(<PaginaAgenda />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(screen.getByText('Tarea del lunes')).toBeInTheDocument();
    expect(screen.getByText('Tarea de hoy')).toBeInTheDocument();
  });

  it('en la vista de día, las tareas sin hora aparecen antes que las que tienen hora, en orden ascendente', async () => {
    const usuario = userEvent.setup();
    const tareas = [
      crearTareaFalsa({ id: 'tarde', titulo: 'Reunión de tarde', fechaLimite: '2026-06-17T18:00:00.000Z' }),
      crearTareaFalsa({ id: 'sin-hora', titulo: 'Recordatorio general', fechaLimite: '2026-06-17T00:00:00.000Z' }),
      crearTareaFalsa({ id: 'manana', titulo: 'Reunión de mañana', fechaLimite: '2026-06-17T09:00:00.000Z' }),
    ];

    renderizarPagina(<PaginaAgenda />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    await usuario.click(screen.getByRole('button', { name: 'Día' }));

    const titulos = screen
      .getAllByRole('button', { name: /Recordatorio general|Reunión de mañana|Reunión de tarde/ })
      .map((elemento) => elemento.textContent);
    expect(titulos).toEqual(['Recordatorio general', 'Reunión de mañana', 'Reunión de tarde']);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('en la vista de mes, un día con más de 3 tareas muestra cuántas quedan sin listar', async () => {
    const usuario = userEvent.setup();
    const tareas = Array.from({ length: 4 }, (_, indice) =>
      crearTareaFalsa({
        id: `tarea-${indice}`,
        titulo: `Tarea ${indice}`,
        fechaLimite: '2026-06-17T09:00:00.000Z',
      }),
    );

    renderizarPagina(<PaginaAgenda />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    await usuario.click(screen.getByRole('button', { name: 'Mes' }));

    expect(screen.getByText('+1 más')).toBeInTheDocument();
  });

  it('sin tareas en el período, la vista de día muestra el mensaje vacío', async () => {
    const usuario = userEvent.setup();

    renderizarPagina(<PaginaAgenda />);

    await usuario.click(screen.getByRole('button', { name: 'Día' }));

    expect(screen.getByText('No hay tareas en este período.')).toBeInTheDocument();
  });

  describe('clases del horario de clase', () => {
    // Lunes 15: Matemáticas a las 8:30 en el horario falso; una tarea
    // personal con hora ese mismo día.
    function estado(ambitoActivo: AmbitoActivo, sesion = SESION_MODO_ESCOLAR) {
      return {
        sesion,
        interfaz: { idioma: 'es' as const, tema: 'claro' as const, ambitoActivo },
        tareas: {
          lista: [
            crearTareaFalsa({
              id: 'dentista',
              titulo: 'Dentista',
              fechaLimite: '2026-06-15T17:00:00.000Z',
            }),
          ],
          cargando: false,
          error: null,
        },
        horario: {
          cursos: [],
          lista: [],
          activo: crearHorarioFalso(),
          cargado: true,
          guardando: false,
          error: null,
        },
      };
    }

    it('con "Todo", la semana muestra las clases junto a las tareas personales con hora', () => {
      renderizarPagina(<PaginaAgenda />, { estadoPrecargado: estado('TODOS') });

      expect(screen.getByText('Matemáticas')).toHaveStyle({ backgroundColor: '#3B82F6' });
      expect(screen.getByText('Dentista')).toBeInTheDocument();
    });

    it('con "Escolar", muestra las clases pero no las tareas personales', () => {
      renderizarPagina(<PaginaAgenda />, { estadoPrecargado: estado('ESCOLAR') });

      expect(screen.getByText('Matemáticas')).toBeInTheDocument();
      expect(screen.queryByText('Dentista')).not.toBeInTheDocument();
    });

    it('con "Personal", no muestra las clases', () => {
      renderizarPagina(<PaginaAgenda />, { estadoPrecargado: estado('PERSONAL') });

      expect(screen.queryByText('Matemáticas')).not.toBeInTheDocument();
      expect(screen.getByText('Dentista')).toBeInTheDocument();
    });

    it('con el modo escolar apagado, no muestra las clases', () => {
      renderizarPagina(<PaginaAgenda />, { estadoPrecargado: estado('TODOS', SESION_AUTENTICADA) });

      expect(screen.queryByText('Matemáticas')).not.toBeInTheDocument();
    });

    it('en la vista de día, la clase sale con su hora de fin y su aula', async () => {
      const usuario = userEvent.setup();
      renderizarPagina(<PaginaAgenda />, { estadoPrecargado: estado('TODOS') });

      await usuario.click(screen.getByRole('button', { name: /lun/i }));

      expect(screen.getByText('hasta las 09:30 · 12')).toBeInTheDocument();
      const horas = screen.getAllByText(/^\d\d:\d\d$/).map((elemento) => elemento.textContent);
      expect(horas).toEqual(['08:30', '17:00']);
    });
  });
});
