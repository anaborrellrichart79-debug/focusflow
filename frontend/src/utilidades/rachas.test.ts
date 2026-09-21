import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calcularRachaDias } from './rachas';

describe('calcularRachaDias', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T18:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve 0 si no hay ninguna fecha', () => {
    expect(calcularRachaDias([])).toBe(0);
  });

  it('devuelve 0 si la última actividad fue hace más de un día', () => {
    expect(calcularRachaDias(['2026-06-12T10:00:00.000Z'])).toBe(0);
  });

  it('cuenta 1 si solo hay actividad hoy', () => {
    expect(calcularRachaDias(['2026-06-15T09:00:00.000Z'])).toBe(1);
  });

  it('sigue contando la racha si hoy todavía no hay actividad pero ayer sí', () => {
    expect(calcularRachaDias(['2026-06-14T09:00:00.000Z'])).toBe(1);
  });

  it('cuenta los días consecutivos hacia atrás, aunque haya varias sesiones el mismo día', () => {
    const fechas = [
      '2026-06-15T08:00:00.000Z',
      '2026-06-15T20:00:00.000Z',
      '2026-06-14T09:00:00.000Z',
      '2026-06-13T09:00:00.000Z',
      '2026-06-11T09:00:00.000Z', // hay un hueco el día 12: la racha se corta ahí
    ];

    expect(calcularRachaDias(fechas)).toBe(3);
  });
});
