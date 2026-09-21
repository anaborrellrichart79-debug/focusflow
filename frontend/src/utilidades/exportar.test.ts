import { describe, expect, it } from 'vitest';
import { construirFilaCsv } from './exportar';

describe('construirFilaCsv', () => {
  it('une los campos simples con comas', () => {
    expect(construirFilaCsv(['a', 'b', 3])).toBe('a,b,3');
  });

  it('entrecomilla un campo que contiene una coma', () => {
    expect(construirFilaCsv(['Comprar pan, leche y huevos', 'ok'])).toBe(
      '"Comprar pan, leche y huevos",ok',
    );
  });

  it('duplica las comillas internas y entrecomilla el campo', () => {
    expect(construirFilaCsv(['Dijo "hola"'])).toBe('"Dijo ""hola"""');
  });

  it('entrecomilla un campo con salto de línea', () => {
    expect(construirFilaCsv(['línea 1\nlínea 2'])).toBe('"línea 1\nlínea 2"');
  });

  it('no toca un campo sin caracteres especiales', () => {
    expect(construirFilaCsv(['normal'])).toBe('normal');
  });
});
