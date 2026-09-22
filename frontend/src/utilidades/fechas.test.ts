import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calcularFinBloque,
  combinarFechaYHora,
  diasHastaFecha,
  esUrgentePorFecha,
  obtenerSoloFecha,
  obtenerSoloHora,
  tieneHoraInicio,
} from './fechas';

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

  describe('tieneHoraInicio', () => {
    it('es false para una fecha límite sin hora (medianoche UTC)', () => {
      expect(tieneHoraInicio('2026-06-16T00:00:00.000Z')).toBe(false);
    });

    it('es true para una fecha límite con hora', () => {
      expect(tieneHoraInicio('2026-06-16T09:30:00.000Z')).toBe(true);
    });
  });

  describe('obtenerSoloFecha', () => {
    it('devuelve la parte de fecha en formato YYYY-MM-DD', () => {
      expect(obtenerSoloFecha('2026-06-16T09:30:00.000Z')).toBe('2026-06-16');
    });
  });

  describe('obtenerSoloHora', () => {
    it('devuelve la parte de hora en formato HH:MM cuando hay hora de inicio', () => {
      expect(obtenerSoloHora('2026-06-16T09:30:00.000Z')).toBe('09:30');
    });

    it('devuelve cadena vacía cuando no hay hora de inicio', () => {
      expect(obtenerSoloHora('2026-06-16T00:00:00.000Z')).toBe('');
    });
  });

  describe('combinarFechaYHora', () => {
    it('combina fecha y hora en un ISO-8601 completo en UTC', () => {
      expect(combinarFechaYHora('2026-06-16', '09:30')).toBe('2026-06-16T09:30:00.000Z');
    });

    it('usa medianoche cuando no se indica hora', () => {
      expect(combinarFechaYHora('2026-06-16', '')).toBe('2026-06-16T00:00:00.000Z');
    });
  });

  describe('calcularFinBloque', () => {
    it('suma la duración indicada a la hora de inicio', () => {
      const fin = calcularFinBloque('2026-06-16T09:00:00.000Z', 45);
      expect(fin.toISOString()).toBe('2026-06-16T09:45:00.000Z');
    });

    it('usa 30 minutos por defecto si no hay duración', () => {
      const fin = calcularFinBloque('2026-06-16T09:00:00.000Z', null);
      expect(fin.toISOString()).toBe('2026-06-16T09:30:00.000Z');
    });
  });
});
