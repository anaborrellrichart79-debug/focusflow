import { describe, expect, it } from 'vitest';
import { perfilesEfectivos, perfilesSugeridos } from './perfiles';

describe('perfiles', () => {
  it('sugiere Estudiante con el modo escolar y Profesional sin él', () => {
    expect(perfilesSugeridos({ modoEscolarActivo: true }, 0)).toEqual(['ESTUDIANTE']);
    expect(perfilesSugeridos({ modoEscolarActivo: false }, 0)).toEqual(['PROFESIONAL']);
  });

  it('sugiere también Padre si supervisa a alguien', () => {
    expect(perfilesSugeridos({ modoEscolarActivo: false }, 2)).toEqual(['PROFESIONAL', 'PADRE']);
  });

  it('los perfiles elegidos mandan sobre los sugeridos', () => {
    expect(perfilesEfectivos({ modoEscolarActivo: true, perfiles: ['PADRE'] }, 0)).toEqual({
      perfiles: ['PADRE'],
      sugeridos: false,
    });
    expect(perfilesEfectivos({ modoEscolarActivo: true, perfiles: [] }, 0)).toEqual({
      perfiles: ['ESTUDIANTE'],
      sugeridos: true,
    });
  });
});
