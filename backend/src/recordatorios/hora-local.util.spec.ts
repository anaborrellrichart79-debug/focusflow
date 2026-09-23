import { describe, expect, it } from 'vitest';
import { obtenerHoraLocal, vencimientoEfectivo } from './hora-local.util.js';

describe('obtenerHoraLocal', () => {
  it('pasa la hora UTC a la hora de reloj de Madrid (verano, UTC+2)', () => {
    const local = obtenerHoraLocal(
      new Date('2026-09-23T22:30:00.000Z'),
      'Europe/Madrid',
    );

    // En UTC aún es miércoles, pero en Madrid ya es jueves 00:30.
    expect(local).toEqual({
      fecha: '2026-09-24',
      hora: '00:30',
      diaSemana: 4,
      flotante: new Date('2026-09-24T00:30:00.000Z'),
    });
  });

  it('tiene en cuenta el horario de invierno (UTC+1)', () => {
    expect(
      obtenerHoraLocal(new Date('2026-12-01T10:00:00.000Z'), 'Europe/Madrid')
        .hora,
    ).toBe('11:00');
  });
});

describe('vencimientoEfectivo', () => {
  it('una fecha sin hora vence al final de ese día', () => {
    expect(vencimientoEfectivo(new Date('2026-09-23T00:00:00.000Z'))).toEqual(
      new Date('2026-09-23T23:59:00.000Z'),
    );
  });

  it('una fecha con hora vence a esa hora', () => {
    const fecha = new Date('2026-09-23T09:30:00.000Z');
    expect(vencimientoEfectivo(fecha)).toEqual(fecha);
  });
});
