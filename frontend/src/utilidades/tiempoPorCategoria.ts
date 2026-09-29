import type { Etiqueta } from '@/servicios/etiquetas';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Tarea } from '@/servicios/tareas';
import { rutaEtiqueta } from './etiquetas';

export type PeriodoTiempo = 'SEMANA' | 'MES' | 'SIEMPRE';
export type AgrupacionTiempo = 'ETIQUETA' | 'ASIGNATURA';

const DIAS_PERIODO: Record<PeriodoTiempo, number | null> = { SEMANA: 7, MES: 30, SIEMPRE: null };

// Filas especiales, siempre al final de la lista.
export const CLAVE_SIN_CATEGORIA = 'sin-categoria';
export const CLAVE_SIN_TAREA = 'sin-tarea';

export interface FilaTiempo {
  clave: string;
  // null en las filas especiales (se traducen en la vista).
  nombre: string | null;
  color: string | null;
  segundos: number;
}

// "Últimos 7 días" como el resto de Estadísticas, no "desde el lunes".
export function inicioPeriodo(periodo: PeriodoTiempo, ahora = new Date()): Date | null {
  const dias = DIAS_PERIODO[periodo];
  return dias === null ? null : new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
}

// Reparte el tiempo de los pomodoros de trabajo entre las etiquetas o las
// asignaturas de su tarea. Una tarea con varias etiquetas suma su tiempo en
// todas, así que con etiquetas las filas pueden sumar más que el total.
export function tiempoPorCategoria(
  sesiones: SesionPomodoro[],
  tareas: Tarea[],
  etiquetas: Etiqueta[],
  agrupacion: AgrupacionTiempo,
  desde: Date | null,
): { filas: FilaTiempo[]; totalSegundos: number } {
  const tareasPorId = new Map(tareas.map((tarea) => [tarea.id, tarea]));
  const filas = new Map<string, FilaTiempo>();
  let totalSegundos = 0;

  function sumar(clave: string, nombre: string | null, color: string | null, segundos: number) {
    const fila = filas.get(clave) ?? { clave, nombre, color, segundos: 0 };
    fila.segundos += segundos;
    filas.set(clave, fila);
  }

  for (const sesion of sesiones) {
    if (sesion.fase !== 'TRABAJO') continue;
    if (desde && new Date(sesion.completadaEn) < desde) continue;
    totalSegundos += sesion.duracionSegundos;

    // Si la tarea se borró, el pomodoro se queda sin tarea (onDelete: SetNull).
    const tarea = sesion.tareaId ? tareasPorId.get(sesion.tareaId) : undefined;
    if (!tarea) {
      sumar(CLAVE_SIN_TAREA, null, null, sesion.duracionSegundos);
      continue;
    }

    if (agrupacion === 'ASIGNATURA') {
      const asignatura = tarea.asignaturaHorario;
      if (asignatura) {
        // Por nombre: la misma asignatura de dos horarios (cursos) va junta.
        const nombre = asignatura.asignatura.nombre;
        sumar(`asignatura:${nombre}`, nombre, asignatura.color, sesion.duracionSegundos);
      } else {
        sumar(CLAVE_SIN_CATEGORIA, null, null, sesion.duracionSegundos);
      }
      continue;
    }

    if (tarea.etiquetas.length === 0) {
      sumar(CLAVE_SIN_CATEGORIA, null, null, sesion.duracionSegundos);
      continue;
    }
    for (const etiqueta of tarea.etiquetas) {
      const ruta = rutaEtiqueta(etiquetas, etiqueta.id) || etiqueta.nombre;
      sumar(`etiqueta:${etiqueta.id}`, ruta, null, sesion.duracionSegundos);
    }
  }

  const ordenadas = [...filas.values()].sort((a, b) => {
    const especialA = a.nombre === null ? 1 : 0;
    const especialB = b.nombre === null ? 1 : 0;
    return especialA - especialB || b.segundos - a.segundos;
  });
  return { filas: ordenadas, totalSegundos };
}
