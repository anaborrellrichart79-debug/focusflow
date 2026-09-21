import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { construirSemanasActividad } from './actividad';

describe('construirSemanasActividad', () => {
  beforeEach(() => {
    // Lunes 15 de junio de 2026, mediodía UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve el número de semanas pedido, cada una con 7 días', () => {
    const semanas = construirSemanasActividad([], 4);

    expect(semanas).toHaveLength(4);
    semanas.forEach((semana) => expect(semana).toHaveLength(7));
  });

  it('la última columna es la semana actual y termina en domingo', () => {
    const semanas = construirSemanasActividad([], 4);
    const ultimaSemana = semanas[semanas.length - 1];

    expect(ultimaSemana[0].fecha.getDay()).toBe(1); // lunes
    expect(ultimaSemana[6].fecha.getDay()).toBe(0); // domingo
    expect(ultimaSemana[0].fecha.getDate()).toBe(15);
  });

  it('cuenta correctamente varias sesiones el mismo día y las reparte en el día correcto', () => {
    const semanas = construirSemanasActividad(
      [
        '2026-06-15T08:00:00.000Z',
        '2026-06-15T20:00:00.000Z',
        '2026-06-10T09:00:00.000Z',
      ],
      4,
    );
    const todos = semanas.flat();

    const hoy = todos.find((dia) => dia.fecha.getDate() === 15 && dia.fecha.getMonth() === 5);
    const miercoles = todos.find((dia) => dia.fecha.getDate() === 10 && dia.fecha.getMonth() === 5);

    expect(hoy?.cantidad).toBe(2);
    expect(miercoles?.cantidad).toBe(1);
  });

  it('los días sin actividad tienen cantidad 0', () => {
    const semanas = construirSemanasActividad([], 4);
    const total = semanas.flat().reduce((suma, dia) => suma + dia.cantidad, 0);

    expect(total).toBe(0);
  });
});
