import { describe, expect, it } from 'vitest';
import { configEfectiva, limitarCampo, presetDe, presetPorEdad } from './pomodoro';

describe('Pomodoro por edad', () => {
  it('propone la duración según la edad (y la clásica si no se sabe)', () => {
    expect(presetPorEdad(6)).toBe('peques');
    expect(presetPorEdad(7)).toBe('peques');
    expect(presetPorEdad(10)).toBe('primaria');
    expect(presetPorEdad(13)).toBe('secundaria');
    expect(presetPorEdad(16)).toBe('clasico');
    expect(presetPorEdad(null)).toBe('clasico');
  });

  it('la de la cuenta manda sobre la de su edad', () => {
    const propia = { trabajo: 8, descansoCorto: 2, descansoLargo: 6, ciclos: 3 };
    expect(configEfectiva(propia, 6)).toBe(propia);
    expect(configEfectiva(null, 6)).toEqual({ trabajo: 5, descansoCorto: 1, descansoLargo: 5, ciclos: 3 });
  });

  it('reconoce el preset de una configuración y la mantiene dentro de los límites', () => {
    expect(presetDe({ trabajo: 20, descansoCorto: 4, descansoLargo: 15, ciclos: 4 })).toBe('secundaria');
    expect(presetDe({ trabajo: 8, descansoCorto: 2, descansoLargo: 6, ciclos: 3 })).toBeNull();
    expect(limitarCampo('trabajo', 3)).toBe(5);
    expect(limitarCampo('descansoCorto', 0)).toBe(1);
    expect(limitarCampo('trabajo', 500)).toBe(90);
    expect(limitarCampo('ciclos', Number.NaN)).toBe(2);
  });
});
