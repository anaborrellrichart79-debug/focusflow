import { describe, expect, it } from 'vitest';
import { ComunidadAutonoma } from '../generated/prisma/enums.js';
import { CALENDARIO_ESCOLAR, sumarDias } from './calendario-escolar.js';

describe('calendario escolar precargado', () => {
  it('tiene calendario para todas las comunidades', () => {
    expect(Object.keys(CALENDARIO_ESCOLAR).sort()).toEqual(
      Object.values(ComunidadAutonoma).sort(),
    );
  });

  it.each(Object.entries(CALENDARIO_ESCOLAR))(
    '%s: periodos ordenados, bien formados y dentro del curso',
    (_, calendario) => {
      expect(calendario.inicioClases < calendario.finClases).toBe(true);
      const inicios = calendario.periodos.map((periodo) => periodo.inicio);
      expect(inicios).toEqual([...inicios].sort());
      for (const periodo of calendario.periodos) {
        expect(periodo.inicio <= periodo.fin).toBe(true);
        expect(periodo.inicio >= calendario.inicioClases).toBe(true);
      }
      const claves = calendario.periodos.map((periodo) => periodo.clave);
      expect(claves).toEqual(
        expect.arrayContaining(['navidad', 'semana-santa', 'verano']),
      );
      expect(new Set(claves).size).toBe(claves.length);
    },
  );

  it('el verano empieza el día siguiente al último día de clase', () => {
    const valencia = CALENDARIO_ESCOLAR.COMUNITAT_VALENCIANA;
    expect(valencia.periodos.at(-1)).toMatchObject({
      clave: 'verano',
      inicio: '2027-06-19',
    });
  });

  it('sumarDias cruza meses y años sin depender de la zona horaria', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2027-03-01', -1)).toBe('2027-02-28');
  });
});
