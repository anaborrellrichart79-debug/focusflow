import { describe, expect, it } from 'vitest';
import { crearTiendaDePrueba, SESION_AUTENTICADA, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import type { Objetivo } from '@/servicios/objetivos';
import type { SesionPomodoro } from '@/servicios/pomodoro';
import type { Ambito, Tarea } from '@/servicios/tareas';
import type { AmbitoActivo } from './interfazSlice';
import {
  ambitoParaNuevoElemento,
  seleccionarHistorialPomodoroDelAmbito,
  seleccionarObjetivosDelAmbito,
  seleccionarTareasDelAmbito,
} from './selectores';

function tarea(id: string, ambito: Ambito) {
  return { id, titulo: id, ambito } as Tarea;
}

function objetivo(id: string, ambito: Ambito) {
  return { id, titulo: id, ambito } as Objetivo;
}

function sesion(id: string, tareaId: string | null) {
  return { id, fase: 'TRABAJO', duracionSegundos: 1500, tareaId } as SesionPomodoro;
}

function estadoCon(ambitoActivo: AmbitoActivo, modoEscolar = true) {
  return crearTiendaDePrueba({
    sesion: modoEscolar ? SESION_MODO_ESCOLAR : SESION_AUTENTICADA,
    interfaz: { idioma: 'es', tema: 'claro', ambitoActivo },
    tareas: {
      lista: [tarea('personal', 'PERSONAL'), tarea('escolar', 'ESCOLAR')],
      cargando: false,
      error: null,
    },
    objetivos: {
      lista: [objetivo('obj-personal', 'PERSONAL'), objetivo('obj-escolar', 'ESCOLAR')],
      cargando: false,
      error: null,
    },
    pomodoro: {
      ...crearTiendaDePrueba().getState().pomodoro,
      historial: [
        sesion('s-personal', 'personal'),
        sesion('s-escolar', 'escolar'),
        sesion('s-sin-tarea', null),
      ],
    },
  }).getState();
}

describe('selectores de ámbito', () => {
  it('con "Todos" devuelve todas las tareas y objetivos sin filtrar', () => {
    const estado = estadoCon('TODOS');
    expect(seleccionarTareasDelAmbito(estado).map((t) => t.id)).toEqual(['personal', 'escolar']);
    expect(seleccionarObjetivosDelAmbito(estado)).toHaveLength(2);
    expect(seleccionarHistorialPomodoroDelAmbito(estado)).toHaveLength(3);
  });

  it('con "Escolar" deja solo las tareas y objetivos escolares', () => {
    const estado = estadoCon('ESCOLAR');
    expect(seleccionarTareasDelAmbito(estado).map((t) => t.id)).toEqual(['escolar']);
    expect(seleccionarObjetivosDelAmbito(estado).map((o) => o.id)).toEqual(['obj-escolar']);
  });

  it('oculta las sesiones de Pomodoro de tareas del otro ámbito, pero mantiene las que no tienen tarea', () => {
    const estado = estadoCon('PERSONAL');
    expect(seleccionarHistorialPomodoroDelAmbito(estado).map((s) => s.id)).toEqual([
      's-personal',
      's-sin-tarea',
    ]);
  });

  it('memoriza el resultado mientras no cambien las tareas ni el ámbito', () => {
    const estado = estadoCon('ESCOLAR');
    expect(seleccionarTareasDelAmbito(estado)).toBe(seleccionarTareasDelAmbito(estado));
  });

  it('ambitoParaNuevoElemento usa el ámbito activo, o nada con "Todos"', () => {
    expect(ambitoParaNuevoElemento(estadoCon('ESCOLAR'))).toBe('ESCOLAR');
    expect(ambitoParaNuevoElemento(estadoCon('TODOS'))).toBeUndefined();
  });

  it('con el modo escolar desactivado ignora el ámbito guardado y lo muestra todo', () => {
    const estado = estadoCon('ESCOLAR', false);
    expect(seleccionarTareasDelAmbito(estado)).toHaveLength(2);
    expect(seleccionarObjetivosDelAmbito(estado)).toHaveLength(2);
    expect(ambitoParaNuevoElemento(estado)).toBeUndefined();
  });
});
