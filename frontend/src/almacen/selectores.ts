import { createSelector } from '@reduxjs/toolkit';
import type { EstadoRaiz } from './store';

// El filtro por ámbito (Personal/Escolar/Todos) es 100% client-side, igual que
// el resto de vistas: el backend siempre devuelve todas las tareas y objetivos
// del usuario y cada página se queda solo con los del ámbito activo.

const seleccionarAmbitoActivo = (estado: EstadoRaiz) => estado.interfaz.ambitoActivo;

export const seleccionarTareasDelAmbito = createSelector(
  [(estado: EstadoRaiz) => estado.tareas.lista, seleccionarAmbitoActivo],
  (tareas, ambito) =>
    ambito === 'TODOS' ? tareas : tareas.filter((tarea) => tarea.ambito === ambito),
);

export const seleccionarObjetivosDelAmbito = createSelector(
  [(estado: EstadoRaiz) => estado.objetivos.lista, seleccionarAmbitoActivo],
  (objetivos, ambito) =>
    ambito === 'TODOS' ? objetivos : objetivos.filter((objetivo) => objetivo.ambito === ambito),
);

// Las sesiones de Pomodoro no tienen ámbito propio: se ocultan solo las
// asociadas a una tarea del otro ámbito. Las sesiones sin tarea asociada se
// mantienen siempre (son tiempo de concentración "neutro", y quitarlas
// rompería la racha de días seguidos al cambiar de ámbito).
export const seleccionarHistorialPomodoroDelAmbito = createSelector(
  [
    (estado: EstadoRaiz) => estado.pomodoro.historial,
    (estado: EstadoRaiz) => estado.tareas.lista,
    seleccionarAmbitoActivo,
  ],
  (historial, tareas, ambito) => {
    if (ambito === 'TODOS') return historial;
    const idsOtroAmbito = new Set(
      tareas.filter((tarea) => tarea.ambito !== ambito).map((tarea) => tarea.id),
    );
    return historial.filter((sesion) => !sesion.tareaId || !idsOtroAmbito.has(sesion.tareaId));
  },
);

// Una tarea u objetivo nuevo creado sin ámbito explícito toma el ámbito activo,
// para que no "desaparezca" nada más crearlo al estar filtrando por Escolar.
// Con "Todos" se deja sin indicar y el backend aplica su default (PERSONAL).
export function ambitoParaNuevoElemento(estado: EstadoRaiz) {
  const ambito = estado.interfaz.ambitoActivo;
  return ambito === 'TODOS' ? undefined : ambito;
}
