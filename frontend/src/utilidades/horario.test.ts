import { describe, expect, it } from 'vitest';
import { crearHorarioFalso } from '@/pruebas/horarioFalso';
import { colorTextoSobre } from './colores';
import { claveCelda, indexarCeldas, nombreDia, periodoEscolarActual } from './horario';

describe('utilidades del horario', () => {
  it('indexarCeldas encuentra la asignatura de cada celda por franja y día', () => {
    const celdas = indexarCeldas(crearHorarioFalso());

    expect(celdas.get(claveCelda('franja-1', 1))?.asignatura.asignatura.nombre).toBe('Matemáticas');
    expect(celdas.get(claveCelda('franja-1', 2))).toBeUndefined();
  });

  it('nombreDia usa el idioma de la interfaz (1 = lunes)', () => {
    expect(nombreDia(1, 'es')).toBe('lunes');
    expect(nombreDia(5, 'en')).toBe('Friday');
    expect(nombreDia(3, 'ca')).toBe('dimecres');
  });

  it('periodoEscolarActual cambia de curso en septiembre', () => {
    expect(periodoEscolarActual(new Date(2026, 8, 1))).toBe('26/27');
    expect(periodoEscolarActual(new Date(2027, 5, 30))).toBe('26/27');
    expect(periodoEscolarActual(new Date(2026, 7, 31))).toBe('25/26');
  });

  it('colorTextoSobre elige negro sobre colores claros y blanco sobre oscuros', () => {
    expect(colorTextoSobre('#FACC15')).toBe('#000000'); // amarillo
    expect(colorTextoSobre('#FFFFFF')).toBe('#000000');
    expect(colorTextoSobre('#1E3A8A')).toBe('#ffffff'); // azul oscuro
    expect(colorTextoSobre('#000000')).toBe('#ffffff');
  });
});
