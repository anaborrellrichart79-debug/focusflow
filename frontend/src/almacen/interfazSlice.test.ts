import { beforeEach, describe, expect, it } from 'vitest';
import reductor, { alternarTema, cambiarIdioma } from './interfazSlice';
import { IDIOMA_POR_DEFECTO } from '@/idiomas';

describe('interfazSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('empieza con el idioma por defecto y el tema claro si no hay nada guardado', () => {
    const estado = reductor(undefined, { type: '@@INIT' });
    expect(estado.idioma).toBe(IDIOMA_POR_DEFECTO);
    expect(estado.tema).toBe('claro');
  });

  it('cambiarIdioma actualiza el idioma seleccionado', () => {
    const estado = reductor(undefined, cambiarIdioma('eu'));
    expect(estado.idioma).toBe('eu');
  });

  it('alternarTema pasa de claro a oscuro y viceversa', () => {
    let estado = reductor(undefined, { type: '@@INIT' });
    expect(estado.tema).toBe('claro');

    estado = reductor(estado, alternarTema());
    expect(estado.tema).toBe('oscuro');

    estado = reductor(estado, alternarTema());
    expect(estado.tema).toBe('claro');
  });

  it('alternarTema guarda la preferencia en localStorage', () => {
    const estado = reductor(undefined, alternarTema());
    expect(localStorage.getItem('focusflow.tema')).toBe(estado.tema);
  });
});
