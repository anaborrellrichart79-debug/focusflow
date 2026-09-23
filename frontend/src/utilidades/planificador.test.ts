import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tarea } from '@/servicios/tareas';
import { agruparEntregasEscolares } from './planificador';

function entrega(datos: Partial<Tarea>): Tarea {
  return {
    id: 'x',
    titulo: 'x',
    estado: 'POR_HACER',
    ambito: 'ESCOLAR',
    tipoEscolar: 'EXAMEN',
    fechaLimite: null,
    ...datos,
  } as Tarea;
}

function ids(tareas: Tarea[]) {
  return tareas.map((tarea) => tarea.id);
}

describe('agruparEntregasEscolares', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reparte las entregas en vencidas, próximos 7 días, más adelante y sin fecha', () => {
    const grupos = agruparEntregasEscolares([
      entrega({ id: 'vencida', fechaLimite: '2026-06-10T12:00:00.000Z' }),
      entrega({ id: 'hoy', fechaLimite: '2026-06-15T12:00:00.000Z' }),
      entrega({ id: 'en-7-dias', fechaLimite: '2026-06-22T12:00:00.000Z' }),
      entrega({ id: 'en-un-mes', fechaLimite: '2026-07-15T12:00:00.000Z' }),
      entrega({ id: 'sin-fecha' }),
    ]);

    expect(ids(grupos.vencidas)).toEqual(['vencida']);
    expect(ids(grupos.estaSemana)).toEqual(['hoy', 'en-7-dias']);
    expect(ids(grupos.masAdelante)).toEqual(['en-un-mes']);
    expect(ids(grupos.sinFecha)).toEqual(['sin-fecha']);
  });

  it('ordena cada grupo por fecha ascendente', () => {
    const grupos = agruparEntregasEscolares([
      entrega({ id: 'viernes', fechaLimite: '2026-06-19T12:00:00.000Z' }),
      entrega({ id: 'martes', fechaLimite: '2026-06-16T12:00:00.000Z' }),
    ]);

    expect(ids(grupos.estaSemana)).toEqual(['martes', 'viernes']);
  });

  it('deja fuera las tareas personales, las escolares sin tipo y las ya hechas', () => {
    const grupos = agruparEntregasEscolares([
      entrega({ id: 'personal', ambito: 'PERSONAL' }),
      entrega({ id: 'sin-tipo', tipoEscolar: null }),
      entrega({ id: 'hecha', estado: 'HECHA' }),
      entrega({ id: 'valida' }),
    ]);

    expect(ids(grupos.sinFecha)).toEqual(['valida']);
  });

  it('filtra por tipo cuando se indica uno', () => {
    const grupos = agruparEntregasEscolares(
      [
        entrega({ id: 'examen', tipoEscolar: 'EXAMEN' }),
        entrega({ id: 'trabajo', tipoEscolar: 'TRABAJO' }),
      ],
      'TRABAJO',
    );

    expect(ids(grupos.sinFecha)).toEqual(['trabajo']);
  });
});
