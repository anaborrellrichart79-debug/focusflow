import { describe, expect, it } from 'vitest';
import type { Etiqueta } from '@/servicios/etiquetas';
import { aplanarArbol, idsConDescendientes, padresPosibles, rutaEtiqueta } from './etiquetas';

function etiqueta(id: string, nombre: string, padreId: string | null = null): Etiqueta {
  return { id, nombre, padreId, usuarioId: 'u', creadoEn: '2026-09-01T00:00:00.000Z' };
}

// Estudio › Matemáticas › Cálculo, Estudio › Lectura, y Casa suelta.
const ETIQUETAS = [
  etiqueta('calculo', 'Cálculo', 'mates'),
  etiqueta('casa', 'Casa'),
  etiqueta('estudio', 'Estudio'),
  etiqueta('lectura', 'Lectura', 'estudio'),
  etiqueta('mates', 'Matemáticas', 'estudio'),
];

describe('utilidades de etiquetas', () => {
  it('aplana el árbol en orden de lectura, con su nivel', () => {
    expect(aplanarArbol(ETIQUETAS).map(({ etiqueta: e, nivel }) => `${nivel}:${e.nombre}`)).toEqual([
      '1:Casa',
      '1:Estudio',
      '2:Lectura',
      '2:Matemáticas',
      '3:Cálculo',
    ]);
  });

  it('una etiqueta cuyo padre ya no existe sale en el primer nivel', () => {
    expect(aplanarArbol([etiqueta('huerfana', 'Huérfana', 'borrada')])[0].nivel).toBe(1);
  });

  it('da la ruta completa de una etiqueta', () => {
    expect(rutaEtiqueta(ETIQUETAS, 'calculo')).toBe('Estudio › Matemáticas › Cálculo');
    expect(rutaEtiqueta(ETIQUETAS, 'casa')).toBe('Casa');
  });

  it('incluye todas las que cuelgan de una etiqueta', () => {
    expect([...idsConDescendientes(ETIQUETAS, 'estudio')].sort()).toEqual([
      'calculo',
      'estudio',
      'lectura',
      'mates',
    ]);
    expect([...idsConDescendientes(ETIQUETAS, 'casa')]).toEqual(['casa']);
  });

  it('solo ofrece como padre lo que no la mete en sí misma ni pasa de 3 niveles', () => {
    const nombres = (id?: string) => padresPosibles(ETIQUETAS, id).map(({ etiqueta: e }) => e.id);

    // Una nueva cabe dentro de todo menos de Cálculo (sería el cuarto nivel).
    expect(nombres()).toEqual(['casa', 'estudio', 'lectura', 'mates']);
    // Matemáticas (2 de alto, con Cálculo dentro) solo cabe en una de primer nivel.
    expect(nombres('mates')).toEqual(['casa', 'estudio']);
    // Estudio (3 de alto) no cabe dentro de nada.
    expect(nombres('estudio')).toEqual([]);
  });
});
