import { createSelector } from '@reduxjs/toolkit';
import type { EstadoRaiz } from './store';

// El filtro por ámbito (Personal/Escolar/Todos) es 100% client-side, igual que
// el resto de vistas: el backend siempre devuelve todas las tareas y objetivos
// del usuario y cada página se queda solo con los del ámbito activo.

// Con el modo escolar desactivado (Ajustes) el selector no ofrece "Escolar",
// así que se ignora ese ámbito si quedó guardado y se muestra todo: si no,
// alguien que lo dejó en "Escolar" y luego apagó el modo vería listas a
// medias sin saber por qué.
export const seleccionarAmbitoActivo = (estado: EstadoRaiz) =>
  estado.interfaz.ambitoActivo === 'ESCOLAR' && !estado.sesion.usuario?.modoEscolarActivo
    ? 'TODOS'
    : estado.interfaz.ambitoActivo;

// Con archivadas: solo para el Kanban, que tiene su columna.
export const seleccionarTareasDelAmbitoConArchivadas = createSelector(
  [(estado: EstadoRaiz) => estado.tareas.lista, seleccionarAmbitoActivo],
  (tareas, ambito) =>
    ambito === 'TODOS' ? tareas : tareas.filter((tarea) => tarea.ambito === ambito),
);

// Las tareas archivadas están cerradas: desaparecen de todas las demás vistas
// (Agenda, Eisenhower, Revisión, Estadísticas, Pomodoro...).
export const seleccionarTareasDelAmbito = createSelector(
  [seleccionarTareasDelAmbitoConArchivadas],
  (tareas) => tareas.filter((tarea) => tarea.estado !== 'ARCHIVADA'),
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
  const ambito = seleccionarAmbitoActivo(estado);
  return ambito === 'TODOS' ? undefined : ambito;
}
