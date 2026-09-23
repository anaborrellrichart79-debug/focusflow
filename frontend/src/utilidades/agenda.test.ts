import { describe, expect, it } from 'vitest';
import { crearHorarioFalso } from '@/pruebas/horarioFalso';
import type { CalendarioEscolar } from '@/servicios/recordatorios';
import type { Tarea } from '@/servicios/tareas';
import {
  clasesDelDia,
  combinarDia,
  obtenerDiasSemana,
  obtenerSemanasMes,
  ordenarTareasDelDia,
  tareasDelDia,
} from './agenda';

function tareaDePrueba(parcial: Partial<Tarea> & { id: string }): Tarea {
  return {
    titulo: 'Tarea',
    descripcion: null,
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    ambito: 'PERSONAL',
    tipoEscolar: null,
    recurrencia: 'NINGUNA',
    tiempoEstimadoMinutos: null,
    objetivoId: null,
    usuarioId: 'usuario-1',
    subtareas: [],
    etiquetas: [],
    creadoEn: '2026-06-01T00:00:00.000Z',
    actualizadoEn: '2026-06-01T00:00:00.000Z',
    ...parcial,
  };
}

describe('utilidades/agenda', () => {
  describe('obtenerDiasSemana', () => {
    it('devuelve 7 días de lunes a domingo, en UTC', () => {
      // 2026-06-17 es miércoles.
      const dias = obtenerDiasSemana(new Date('2026-06-17T12:00:00.000Z'));

      expect(dias).toHaveLength(7);
      expect(dias[0].toISOString().slice(0, 10)).toBe('2026-06-15'); // lunes
      expect(dias[6].toISOString().slice(0, 10)).toBe('2026-06-21'); // domingo
    });
  });

  describe('obtenerSemanasMes', () => {
    it('cubre el mes completo con semanas de lunes a domingo, rellenando con meses vecinos', () => {
      // Junio de 2026 empieza en lunes (1 de junio) y termina en martes (30 de junio).
      const semanas = obtenerSemanasMes(new Date('2026-06-17T12:00:00.000Z'));

      expect(semanas[0][0].toISOString().slice(0, 10)).toBe('2026-06-01');
      const ultimaSemana = semanas[semanas.length - 1];
      expect(ultimaSemana[6].toISOString().slice(0, 10)).toBe('2026-07-05');
      for (const semana of semanas) {
        expect(semana).toHaveLength(7);
      }
    });
  });

  describe('tareasDelDia', () => {
    it('filtra solo las tareas cuya fechaLimite cae ese día', () => {
      const tareas = [
        tareaDePrueba({ id: 'a', fechaLimite: '2026-06-16T09:00:00.000Z' }),
        tareaDePrueba({ id: 'b', fechaLimite: '2026-06-17T09:00:00.000Z' }),
        tareaDePrueba({ id: 'c', fechaLimite: null }),
      ];

      const resultado = tareasDelDia(tareas, new Date('2026-06-16T00:00:00.000Z'));

      expect(resultado.map((t) => t.id)).toEqual(['a']);
    });
  });

  describe('ordenarTareasDelDia', () => {
    it('pone primero las tareas sin hora y luego las que tienen hora, ascendente', () => {
      const tareas = [
        tareaDePrueba({ id: 'tarde', fechaLimite: '2026-06-16T18:00:00.000Z' }),
        tareaDePrueba({ id: 'sin-hora', fechaLimite: '2026-06-16T00:00:00.000Z' }),
        tareaDePrueba({ id: 'manana', fechaLimite: '2026-06-16T09:00:00.000Z' }),
      ];

      const resultado = ordenarTareasDelDia(tareas);

      expect(resultado.map((t) => t.id)).toEqual(['sin-hora', 'manana', 'tarde']);
    });
  });

  describe('clases del horario', () => {
    // 2026-06-15 es lunes; el horario falso tiene Matemáticas el lunes a las 8:30.
    const lunes = new Date(Date.UTC(2026, 5, 15));
    const martes = new Date(Date.UTC(2026, 5, 16));
    const sabado = new Date(Date.UTC(2026, 5, 20));

    it('clasesDelDia devuelve las clases de ese día de la semana, con hora, nombre y color', () => {
      expect(clasesDelDia(crearHorarioFalso(), lunes)).toEqual([
        {
          id: 's-1',
          horaInicio: '08:30',
          horaFin: '09:30',
          nombre: 'Matemáticas',
          color: '#3B82F6',
          aula: '12',
        },
      ]);
      expect(clasesDelDia(crearHorarioFalso(), martes)).toEqual([]);
    });

    it('no hay clases en un día no lectivo ni fuera del curso escolar', () => {
      const calendario: CalendarioEscolar = {
        curso: '2025-2026',
        comunidad: 'COMUNITAT_VALENCIANA',
        inicioClases: '2025-09-08',
        finClases: '2026-06-19',
        periodos: [],
        propios: [{ id: 'p-1', nombre: 'Fiesta local', inicio: '2026-06-15', fin: '2026-06-15' }],
      };

      expect(clasesDelDia(crearHorarioFalso(), lunes, calendario)).toEqual([]);
      expect(clasesDelDia(crearHorarioFalso(), lunes, { ...calendario, propios: [] })).toHaveLength(1);
      expect(
        clasesDelDia(crearHorarioFalso(), lunes, { ...calendario, propios: [], finClases: '2026-06-12' }),
      ).toEqual([]);
    });

    it('no hay clases en fin de semana ni sin horario', () => {
      expect(clasesDelDia(crearHorarioFalso(), sabado)).toEqual([]);
      expect(clasesDelDia(null, lunes)).toEqual([]);
    });

    it('combinarDia pone primero las tareas sin hora y luego clases y tareas por hora', () => {
      const clases = clasesDelDia(crearHorarioFalso(), lunes);
      const elementos = combinarDia(
        [
          tareaDePrueba({ id: 'tarde', fechaLimite: '2026-06-15T17:00:00.000Z' }),
          tareaDePrueba({ id: 'sin-hora', fechaLimite: '2026-06-15T00:00:00.000Z' }),
          tareaDePrueba({ id: 'temprano', fechaLimite: '2026-06-15T08:00:00.000Z' }),
          tareaDePrueba({ id: 'a-la-vez', fechaLimite: '2026-06-15T08:30:00.000Z' }),
        ],
        clases,
      );

      expect(elementos.map((e) => (e.tipo === 'clase' ? `clase ${e.clase.nombre}` : e.tarea.id))).toEqual([
        'sin-hora',
        'temprano',
        'clase Matemáticas',
        'a-la-vez',
        'tarde',
      ]);
    });
  });
});
