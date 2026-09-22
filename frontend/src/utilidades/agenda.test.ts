import { describe, expect, it } from 'vitest';
import type { Tarea } from '@/servicios/tareas';
import { obtenerDiasSemana, obtenerSemanasMes, ordenarTareasDelDia, tareasDelDia } from './agenda';

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
});
