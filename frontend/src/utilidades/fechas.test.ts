import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diasHastaFecha, esUrgentePorFecha } from './fechas';

// Las horas se fijan a mediodía UTC en el "ahora" y en las fechas de prueba para que la
// comparación de días de calendario no dependa de la zona horaria de quien ejecuta los tests.
describe('utilidades/fechas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('diasHastaFecha', () => {
    it('devuelve 0 para hoy mismo', () => {
      expect(diasHastaFecha('2026-06-15T12:00:00.000Z')).toBe(0);
    });

    it('devuelve un número positivo para una fecha futura', () => {
      expect(diasHastaFecha('2026-06-18T12:00:00.000Z')).toBe(3);
    });

    it('devuelve un número negativo para una fecha pasada', () => {
      expect(diasHastaFecha('2026-06-10T12:00:00.000Z')).toBe(-5);
    });
  });

  describe('esUrgentePorFecha', () => {
    it('es false si no hay fechaLimite', () => {
      expect(esUrgentePorFecha(null)).toBe(false);
    });

    it('es true si vence hoy, mañana o pasado mañana', () => {
      expect(esUrgentePorFecha('2026-06-16T12:00:00.000Z')).toBe(true);
      expect(esUrgentePorFecha('2026-06-17T12:00:00.000Z')).toBe(true);
    });

    it('es true si ya venció (está atrasada)', () => {
      expect(esUrgentePorFecha('2026-06-10T12:00:00.000Z')).toBe(true);
    });

    it('es false si vence dentro de más de 2 días', () => {
      expect(esUrgentePorFecha('2026-06-20T12:00:00.000Z')).toBe(false);
    });
  });
});
