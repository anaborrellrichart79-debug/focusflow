import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { ServicioPrisma } from '../prisma/prisma.service.js';
import {
  construirCalendario,
  elegirCurso,
  sumarDias,
  type FicheroCalendario,
} from './calendario-escolar.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';

const CARPETA = join(import.meta.dirname, '../../datos/calendarios-escolares');

function leer(nombre: string) {
  return JSON.parse(readFileSync(join(CARPETA, nombre), 'utf-8')) as FicheroCalendario;
}

const FICHEROS = readdirSync(CARPETA).filter((nombre) => nombre.endsWith('.json'));

describe('ficheros de calendario escolar (datos/calendarios-escolares)', () => {
  it('hay al menos un curso', () => {
    expect(FICHEROS).toContain('2026-2027.json');
  });

  it.each(FICHEROS)('%s es válido, con periodos ordenados y sin claves repetidas', (nombre) => {
    const calendario = construirCalendario(leer(nombre));
    expect(`${calendario.curso}.json`).toBe(nombre);

    for (const comunidad of Object.values(calendario.comunidades)) {
      expect(comunidad.inicioClases < comunidad.finClases).toBe(true);
      const inicios = comunidad.periodos.map((periodo) => periodo.inicio);
      expect(inicios).toEqual([...inicios].sort());
      const claves = comunidad.periodos.map((periodo) => periodo.clave);
      expect(claves).toEqual(expect.arrayContaining(['navidad', 'semana-santa', 'verano']));
      expect(new Set(claves).size).toBe(claves.length);
    }
  });
});

describe('construirCalendario', () => {
  it('el verano va del día siguiente al último de clase hasta el 31 de agosto', () => {
    const valencia = construirCalendario(leer('2026-2027.json')).comunidades.COMUNITAT_VALENCIANA;
    expect(valencia.periodos.at(-1)).toEqual({
      clave: 'verano',
      nombre: 'Vacaciones de verano',
      inicio: '2027-06-19',
      fin: '2027-08-31',
    });
    expect(valencia.periodos.map((p) => p.clave)).toContain('dia-comunidad');
  });

  it('explica todo lo que está mal: fechas imposibles, fuera del curso, al revés o comunidades que faltan', () => {
    const fichero = leer('2026-2027.json');
    fichero.comunidades.MADRID.navidad = { inicio: '2027-01-06', fin: '2026-12-23' };
    fichero.comunidades.GALICIA.inicioClases = '2026-02-30';
    fichero.comunidades.MURCIA.finClases = '2028-06-20';
    delete (fichero.comunidades as Record<string, unknown>).CEUTA;

    expect(() => construirCalendario(fichero)).toThrow(
      // En el orden de las comunidades del enum (Galicia, Madrid, Murcia... Ceuta).
      /GALICIA\.clases\.inicio: fecha no válida.*MADRID\.navidad: el fin es anterior.*MURCIA\.clases\.fin: 2028-06-20 está fuera.*falta la comunidad CEUTA/,
    );
    expect(() => construirCalendario({ ...fichero, curso: '2026-2028' })).toThrow(/"curso"/);
  });
});

describe('elegirCurso', () => {
  const curso = (nombre: string) => {
    const fichero = leer('2026-2027.json');
    const [a, b] = nombre.split('-');
    // Solo importan desde/hasta: se reutilizan los datos cambiando el curso
    // y desplazando las fechas lo justo para que valide.
    const texto = JSON.stringify(fichero).replaceAll('2027-', `${b}-`).replaceAll('2026-', `${a}-`);
    return construirCalendario({ ...(JSON.parse(texto) as FicheroCalendario), curso: nombre });
  };
  const c2026 = curso('2026-2027');
  const c2027 = curso('2027-2028');

  it('toca el curso de la fecha; el 1 de septiembre cambia solo al siguiente', () => {
    expect(elegirCurso([c2026, c2027], '2027-08-31')?.curso).toBe('2026-2027');
    expect(elegirCurso([c2026, c2027], '2027-09-01')?.curso).toBe('2027-2028');
  });

  it('sin fichero del curso de hoy, usa el último que ya empezó; si todos son futuros, el más próximo', () => {
    expect(elegirCurso([c2026], '2028-01-15')?.curso).toBe('2026-2027');
    expect(elegirCurso([c2027, c2026], '2025-10-01')?.curso).toBe('2026-2027');
    expect(elegirCurso([], '2026-10-01')).toBeNull();
  });
});

describe('CalendarioEscolarService: lectura de la carpeta', () => {
  function servicioCon(carpeta: string) {
    const config = { get: (clave: string) => (clave === 'CALENDARIOS_ESCOLARES_DIR' ? carpeta : undefined) };
    return new CalendarioEscolarService({} as ServicioPrisma, config as unknown as ConfigService);
  }

  it('ignora los ficheros con errores y ve los nuevos sin reiniciar', () => {
    const carpeta = mkdtempSync(join(tmpdir(), 'calendarios-'));
    try {
      writeFileSync(join(carpeta, 'roto.json'), '{ esto no es JSON');
      const servicio = servicioCon(carpeta);
      expect(servicio.cursosDisponibles()).toEqual([]);

      writeFileSync(join(carpeta, '2026-2027.json'), readFileSync(join(CARPETA, '2026-2027.json')));
      expect(servicio.cursosDisponibles().map((c) => c.curso)).toEqual(['2026-2027']);
      expect(servicio.cursoActual(new Date('2026-10-01T10:00:00Z'))?.curso).toBe('2026-2027');
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });
});

it('sumarDias cruza meses y años sin depender de la zona horaria', () => {
  expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  expect(sumarDias('2027-03-01', -1)).toBe('2027-02-28');
});
