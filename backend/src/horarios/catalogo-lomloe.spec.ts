import { describe, expect, it } from 'vitest';
import {
  CategoriaAsignatura,
  ComunidadAutonoma,
  Etapa,
} from '../generated/prisma/enums.js';
import {
  ASIGNATURAS,
  CURSOS,
  LENGUAS_PROPIAS,
  crearSlug,
} from './catalogo-lomloe.js';

describe('catálogo LOMLOE', () => {
  it('tiene 6 cursos de Primaria, 4 de ESO y 2 de Bachillerato', () => {
    expect(
      CURSOS.filter((curso) => curso.etapa === Etapa.PRIMARIA),
    ).toHaveLength(6);
    expect(CURSOS.filter((curso) => curso.etapa === Etapa.ESO)).toHaveLength(4);
    expect(
      CURSOS.filter((curso) => curso.etapa === Etapa.BACHILLERATO),
    ).toHaveLength(2);
  });

  it('no repite ningún id (la carga al arrancar depende de ello)', () => {
    const ids = ASIGNATURAS.map((asignatura) => asignatura.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada curso tiene asignaturas obligatorias', () => {
    for (const curso of CURSOS) {
      const obligatorias = ASIGNATURAS.filter(
        (asignatura) =>
          asignatura.cursoId === curso.id &&
          asignatura.categoria === CategoriaAsignatura.OBLIGATORIA,
      );
      expect(obligatorias.length, curso.id).toBeGreaterThanOrEqual(4);
    }
  });

  it('Educación en Valores Cívicos y Éticos solo aparece en el tercer ciclo de Primaria', () => {
    const cursosConValores = ASIGNATURAS.filter(
      (asignatura) =>
        asignatura.nombre === 'Educación en Valores Cívicos y Éticos' &&
        asignatura.cursoId.startsWith('primaria'),
    ).map((asignatura) => asignatura.cursoId);
    expect(cursosConValores).toEqual(['primaria-5', 'primaria-6']);
  });

  it('4º de ESO ofrece Matemáticas A y B como materias de opción', () => {
    const matematicas = ASIGNATURAS.filter(
      (asignatura) =>
        asignatura.cursoId === 'eso-4' &&
        asignatura.nombre.startsWith('Matemáticas'),
    );
    expect(matematicas.map((asignatura) => asignatura.nombre).sort()).toEqual([
      'Matemáticas A',
      'Matemáticas B',
    ]);
    expect(
      matematicas.every(
        (asignatura) => asignatura.categoria === CategoriaAsignatura.DE_OPCION,
      ),
    ).toBe(true);
  });

  it('todas las modalidades de Bachillerato tienen materias en 1º y en 2º', () => {
    const modalidades = new Set(
      ASIGNATURAS.filter((asignatura) => asignatura.modalidad).map(
        (asignatura) => asignatura.modalidad,
      ),
    );
    expect(modalidades.size).toBe(5);
    for (const modalidad of modalidades) {
      for (const cursoId of ['bachillerato-1', 'bachillerato-2']) {
        expect(
          ASIGNATURAS.some(
            (asignatura) =>
              asignatura.modalidad === modalidad &&
              asignatura.cursoId === cursoId,
          ),
          `${modalidad} en ${cursoId}`,
        ).toBe(true);
      }
    }
  });

  it('cada comunidad con lengua propia la tiene en todos los cursos', () => {
    for (const { comunidad, nombre } of LENGUAS_PROPIAS) {
      for (const curso of CURSOS) {
        expect(
          ASIGNATURAS.some(
            (asignatura) =>
              asignatura.comunidad === comunidad &&
              asignatura.cursoId === curso.id &&
              asignatura.nombre.startsWith(nombre),
          ),
          `${nombre} (${comunidad}) en ${curso.id}`,
        ).toBe(true);
      }
    }
  });

  it('en Bachillerato la lengua propia lleva I/II, como el resto de lenguas', () => {
    const valenciano = ASIGNATURAS.filter(
      (asignatura) =>
        asignatura.comunidad === ComunidadAutonoma.COMUNITAT_VALENCIANA,
    ).map((asignatura) => `${asignatura.cursoId}: ${asignatura.nombre}`);
    expect(valenciano).toContain(
      'bachillerato-1: Valenciano: Lengua y Literatura I',
    );
    expect(valenciano).toContain(
      'bachillerato-2: Valenciano: Lengua y Literatura II',
    );
    expect(valenciano).toContain('eso-3: Valenciano: Lengua y Literatura');
  });

  it('crearSlug quita tildes, eñes y signos', () => {
    expect(crearSlug('Educación Plástica, Visual y Audiovisual')).toBe(
      'educacion-plastica-visual-y-audiovisual',
    );
    expect(crearSlug('CATALUNA')).toBe('cataluna');
  });
});
