import { describe, expect, it } from 'vitest';
import { calcularEdad } from './edad.util.js';

describe('calcularEdad', () => {
  it('cuenta un cumpleaños que ya ha pasado este año', () => {
    const ahora = new Date('2026-09-22T12:00:00.000Z');
    expect(calcularEdad('2010-01-15T00:00:00.000Z', ahora)).toBe(16);
  });

  it('no cuenta un cumpleaños que todavía no ha llegado este año', () => {
    const ahora = new Date('2026-09-22T12:00:00.000Z');
    expect(calcularEdad('2010-12-15T00:00:00.000Z', ahora)).toBe(15);
  });

  it('cumple los 18 exactamente el día del cumpleaños', () => {
    const ahora = new Date('2026-09-22T12:00:00.000Z');
    expect(calcularEdad('2008-09-22T00:00:00.000Z', ahora)).toBe(18);
  });

  it('todavía tiene 17 el día antes de cumplir 18', () => {
    const ahora = new Date('2026-09-21T12:00:00.000Z');
    expect(calcularEdad('2008-09-22T00:00:00.000Z', ahora)).toBe(17);
  });

  it('gestiona correctamente una fecha de nacimiento en año bisiesto (29 de febrero)', () => {
    const ahora = new Date('2027-03-01T12:00:00.000Z');
    expect(calcularEdad('2012-02-29T00:00:00.000Z', ahora)).toBe(15);
  });
});
