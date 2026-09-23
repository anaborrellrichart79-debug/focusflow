import { beforeEach, describe, expect, it, vi } from 'vitest';
import reductor, { alternarTema, cambiarAmbitoActivo, cambiarIdioma } from './interfazSlice';
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

  it('empieza con el ámbito "Todos" si no hay nada guardado', () => {
    const estado = reductor(undefined, { type: '@@INIT' });
    expect(estado.ambitoActivo).toBe('TODOS');
  });

  it('cambiarAmbitoActivo cambia el ámbito y lo guarda en localStorage', () => {
    const estado = reductor(undefined, cambiarAmbitoActivo('ESCOLAR'));
    expect(estado.ambitoActivo).toBe('ESCOLAR');
    expect(localStorage.getItem('focusflow.ambito')).toBe('ESCOLAR');
  });

  it('recupera el ámbito guardado al arrancar, e ignora un valor guardado no válido', async () => {
    localStorage.setItem('focusflow.ambito', 'PERSONAL');
    vi.resetModules();
    const { default: reductorFresco } = await import('./interfazSlice');
    expect(reductorFresco(undefined, { type: '@@INIT' }).ambitoActivo).toBe('PERSONAL');

    localStorage.setItem('focusflow.ambito', 'otro');
    vi.resetModules();
    const { default: reductorConValorInvalido } = await import('./interfazSlice');
    expect(reductorConValorInvalido(undefined, { type: '@@INIT' }).ambitoActivo).toBe('TODOS');
  });
});
