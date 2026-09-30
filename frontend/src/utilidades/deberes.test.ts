import { describe, expect, it } from 'vitest';
import type { Horario } from '@/servicios/horarios';
import type { Tarea } from '@/servicios/tareas';
import { agruparDeberes, fechaDeHoy, proximaClase, sumarDias } from './deberes';

// Matemáticas el lunes (1) y el miércoles (3); Valenciano solo el viernes (5).
const HORARIO = {
  sesiones: [
    { diaSemana: 1, asignaturaHorarioId: 'ah-mates' },
    { diaSemana: 3, asignaturaHorarioId: 'ah-mates' },
    { diaSemana: 5, asignaturaHorarioId: 'ah-valenciano' },
  ],
} as unknown as Horario;

// 30/09/2026 es miércoles.
const MIERCOLES = '2026-09-30';

function deber(fechaLimite: string | null, datos: Partial<Tarea> = {}) {
  return {
    id: `${fechaLimite}-${datos.titulo ?? 'x'}`,
    titulo: 'x',
    tipoEscolar: 'DEBERES',
    estado: 'POR_HACER',
    fechaLimite: fechaLimite ? `${fechaLimite}T00:00:00.000Z` : null,
    ...datos,
  } as Tarea;
}

describe('fechas de los deberes', () => {
  it('fechaDeHoy usa la fecha del dispositivo y sumarDias cruza meses', () => {
    expect(fechaDeHoy(new Date(2026, 8, 30, 23, 30))).toBe('2026-09-30');
    expect(sumarDias('2026-09-30', 2)).toBe('2026-10-02');
  });

  it('próxima clase: el siguiente día que hay esa asignatura (nunca hoy)', () => {
    // Miércoles con Mates: la siguiente es el lunes, no hoy.
    expect(proximaClase(HORARIO, 'ah-mates', MIERCOLES)).toBe('2026-10-05');
    expect(proximaClase(HORARIO, 'ah-valenciano', MIERCOLES)).toBe('2026-10-02');
  });

  it('se salta las vacaciones y festivos', () => {
    const puente = [{ inicio: '2026-10-05', fin: '2026-10-05' }];
    expect(proximaClase(HORARIO, 'ah-mates', MIERCOLES, puente)).toBe('2026-10-07');
  });

  it('sin asignatura, o si no está en el horario, el próximo día lectivo (sin fines de semana)', () => {
    expect(proximaClase(HORARIO, null, MIERCOLES)).toBe('2026-10-01');
    expect(proximaClase(null, 'ah-mates', '2026-10-02')).toBe('2026-10-05');
  });

  it('agrupa los pendientes en atrasados, hoy, mañana y más adelante (y deja fuera lo que no son deberes)', () => {
    const grupos = agruparDeberes(
      [
        deber('2026-10-05'),
        deber('2026-09-29'),
        deber('2026-10-01', { titulo: 'mañana' }),
        deber(MIERCOLES),
        deber(null, { titulo: 'sin fecha' }),
        deber('2026-10-01', { titulo: 'hecho', estado: 'HECHA' }),
        deber('2026-10-01', { titulo: 'examen', tipoEscolar: 'EXAMEN' }),
      ],
      MIERCOLES,
    );

    expect(grupos.atrasados.map((t) => t.fechaLimite)).toEqual(['2026-09-29T00:00:00.000Z']);
    expect(grupos.hoy).toHaveLength(1);
    expect(grupos.manana.map((t) => t.titulo)).toEqual(['mañana']);
    expect(grupos.masAdelante.map((t) => t.fechaLimite)).toEqual(['2026-10-05T00:00:00.000Z', null]);
  });
});
