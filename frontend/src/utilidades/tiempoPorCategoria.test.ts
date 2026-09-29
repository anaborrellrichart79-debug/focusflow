import { describe, expect, it } from 'vitest';
import type { Etiqueta } from '@/servicios/etiquetas';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Tarea } from '@/servicios/tareas';
import {
  CLAVE_SIN_CATEGORIA,
  CLAVE_SIN_TAREA,
  inicioPeriodo,
  tiempoPorCategoria,
} from './tiempoPorCategoria';

const AHORA = new Date('2026-09-29T12:00:00Z');
const HACE_2_DIAS = '2026-09-27T10:00:00Z';
const HACE_20_DIAS = '2026-09-09T10:00:00Z';

function sesion(tareaId: string | null, minutos: number, completadaEn = HACE_2_DIAS, fase = 'TRABAJO') {
  return { id: `${tareaId}-${minutos}-${completadaEn}`, fase, duracionSegundos: minutos * 60, tareaId, completadaEn } as SesionPomodoro;
}

const ETIQUETAS = [
  { id: 'estudio', nombre: 'Estudio', padreId: null },
  { id: 'mates', nombre: 'Matemáticas', padreId: 'estudio' },
  { id: 'lengua', nombre: 'Lengua', padreId: 'estudio' },
] as Etiqueta[];

const TAREAS = [
  {
    id: 'examen',
    etiquetas: [ETIQUETAS[1]],
    asignaturaHorario: { id: 'ah1', color: '#e11d48', asignatura: { nombre: 'Matemáticas' } },
  },
  {
    id: 'redaccion',
    etiquetas: [ETIQUETAS[1], ETIQUETAS[2]],
    asignaturaHorario: { id: 'ah2', color: '#2563eb', asignatura: { nombre: 'Lengua' } },
  },
  { id: 'suelta', etiquetas: [], asignaturaHorario: null },
] as unknown as Tarea[];

describe('tiempoPorCategoria', () => {
  it('reparte por asignatura, con su color, de más a menos y lo que no tiene asignatura al final', () => {
    const sesiones = [sesion('examen', 25), sesion('examen', 25), sesion('redaccion', 25), sesion('suelta', 25)];

    const { filas, totalSegundos } = tiempoPorCategoria(sesiones, TAREAS, ETIQUETAS, 'ASIGNATURA', null);

    expect(totalSegundos).toBe(100 * 60);
    expect(filas).toEqual([
      { clave: 'asignatura:Matemáticas', nombre: 'Matemáticas', color: '#e11d48', segundos: 50 * 60 },
      { clave: 'asignatura:Lengua', nombre: 'Lengua', color: '#2563eb', segundos: 25 * 60 },
      { clave: CLAVE_SIN_CATEGORIA, nombre: null, color: null, segundos: 25 * 60 },
    ]);
  });

  it('por etiqueta usa la ruta completa y una tarea con varias etiquetas suma en todas', () => {
    const { filas } = tiempoPorCategoria([sesion('redaccion', 30)], TAREAS, ETIQUETAS, 'ETIQUETA', null);

    expect(filas.map((f) => [f.nombre, f.segundos / 60])).toEqual([
      ['Estudio › Matemáticas', 30],
      ['Estudio › Lengua', 30],
    ]);
  });

  it('ignora los descansos y lo que queda fuera del periodo, y separa los pomodoros sin tarea', () => {
    const sesiones = [
      sesion('examen', 25),
      sesion('examen', 25, HACE_20_DIAS),
      sesion('examen', 5, HACE_2_DIAS, 'DESCANSO_CORTO'),
      sesion(null, 25),
      sesion('tarea-borrada', 25),
    ];

    const { filas, totalSegundos } = tiempoPorCategoria(
      sesiones,
      TAREAS,
      ETIQUETAS,
      'ASIGNATURA',
      inicioPeriodo('SEMANA', AHORA),
    );

    expect(totalSegundos).toBe(75 * 60);
    expect(filas.find((f) => f.clave === 'asignatura:Matemáticas')?.segundos).toBe(25 * 60);
    expect(filas.find((f) => f.clave === CLAVE_SIN_TAREA)?.segundos).toBe(50 * 60);
  });

  it('"siempre" no pone límite de fecha', () => {
    expect(inicioPeriodo('SIEMPRE', AHORA)).toBeNull();
    expect(inicioPeriodo('MES', AHORA)?.toISOString()).toBe('2026-08-30T12:00:00.000Z');
  });
});
