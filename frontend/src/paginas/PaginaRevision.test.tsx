import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Objetivo } from '@/servicios/objetivos';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaRevision } from './PaginaRevision';

const AHORA = '2026-06-15T12:00:00.000Z';

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

function crearObjetivoFalso(datos: Partial<Objetivo>): Objetivo {
  return {
    id: 'objetivo-1',
    titulo: 'Objetivo de prueba',
    descripcion: null,
    fechaLimite: null,
    ambito: 'PERSONAL',
    totalTareas: 0,
    tareasCompletadas: 0,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

function obtenerSeccion(nombre: string) {
  const titulo = screen.getByText(nombre, { exact: false });
  const card = titulo.closest('[data-slot="card"]');
  if (!card) throw new Error(`No se encontró la sección "${nombre}"`);
  return within(card as HTMLElement);
}

describe('PaginaRevision', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(AHORA));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lista las tareas vencidas y no las que aún no han vencido', () => {
    const tareas = [
      crearTareaFalsa({
        id: 'vencida',
        titulo: 'Entrega atrasada',
        fechaLimite: '2026-06-10T12:00:00.000Z',
      }),
      crearTareaFalsa({
        id: 'futura',
        titulo: 'Entrega futura',
        fechaLimite: '2026-06-20T12:00:00.000Z',
      }),
    ];

    renderizarPagina(<PaginaRevision />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(obtenerSeccion('Tareas vencidas').getByText('Entrega atrasada')).toBeInTheDocument();
    expect(obtenerSeccion('Tareas vencidas').queryByText('Entrega futura')).not.toBeInTheDocument();
  });

  it('sin tareas vencidas, muestra el mensaje vacío', () => {
    renderizarPagina(<PaginaRevision />);

    expect(screen.getByText('No tienes tareas vencidas. ¡Bien hecho!')).toBeInTheDocument();
  });

  it('lista las tareas completadas en los últimos 7 días, pero no las más antiguas', () => {
    const tareas = [
      crearTareaFalsa({
        id: 'reciente',
        titulo: 'Completada reciente',
        estado: 'HECHA',
        actualizadoEn: '2026-06-14T12:00:00.000Z',
      }),
      crearTareaFalsa({
        id: 'antigua',
        titulo: 'Completada hace tiempo',
        estado: 'HECHA',
        actualizadoEn: '2026-05-01T12:00:00.000Z',
      }),
    ];

    renderizarPagina(<PaginaRevision />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    const seccion = obtenerSeccion('Completadas esta semana');
    expect(seccion.getByText('Completada reciente')).toBeInTheDocument();
    expect(seccion.queryByText('Completada hace tiempo')).not.toBeInTheDocument();
  });

  it('lista los objetivos sin tocar en más de 7 días que aún tienen tareas pendientes', () => {
    const objetivos = [
      crearObjetivoFalso({
        id: 'abandonado',
        titulo: 'Objetivo abandonado',
        actualizadoEn: '2026-05-01T12:00:00.000Z',
      }),
      crearObjetivoFalso({
        id: 'reciente',
        titulo: 'Objetivo activo',
        actualizadoEn: '2026-06-14T12:00:00.000Z',
      }),
    ];
    const tareas = [
      crearTareaFalsa({ id: 'a', objetivoId: 'abandonado', estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'b', objetivoId: 'reciente', estado: 'POR_HACER' }),
    ];

    renderizarPagina(<PaginaRevision />, {
      estadoPrecargado: {
        objetivos: { lista: objetivos, cargando: false, error: null },
        tareas: { lista: tareas, cargando: false, error: null },
      },
    });

    const seccion = obtenerSeccion('Objetivos sin tocar');
    expect(seccion.getByText('Objetivo abandonado')).toBeInTheDocument();
    expect(seccion.queryByText('Objetivo activo')).not.toBeInTheDocument();
  });

  it('lista las tareas sueltas pendientes y no las que ya tienen objetivo o están hechas', () => {
    const tareas = [
      crearTareaFalsa({ id: 'suelta', titulo: 'Suelta pendiente', objetivoId: null, estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'con-objetivo', titulo: 'Con objetivo', objetivoId: 'objetivo-1' }),
      crearTareaFalsa({ id: 'suelta-hecha', titulo: 'Suelta hecha', objetivoId: null, estado: 'HECHA' }),
    ];

    renderizarPagina(<PaginaRevision />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    const seccion = obtenerSeccion('Tareas sueltas por organizar');
    expect(seccion.getByText('Suelta pendiente')).toBeInTheDocument();
    expect(seccion.queryByText('Con objetivo')).not.toBeInTheDocument();
    expect(seccion.queryByText('Suelta hecha')).not.toBeInTheDocument();
  });
});
