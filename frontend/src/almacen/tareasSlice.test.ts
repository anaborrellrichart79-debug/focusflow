import { describe, expect, it } from 'vitest';
import type { Subtarea } from '@/servicios/subtareas';
import type { Tarea } from '@/servicios/tareas';
import reductor, {
  cambiarEstadoTarea,
  cambiarSubtarea,
  cargarTareas,
  crearSubtareaTarea,
  crearTarea,
  eliminarSubtareaTarea,
  eliminarTarea,
} from './tareasSlice';

function crearSubtareaFalsa(datos: Partial<Subtarea>): Subtarea {
  return {
    id: 'subtarea-1',
    titulo: 'Paso de prueba',
    completada: false,
    tareaId: 'tarea-1',
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

function crearTareaFalsa(datos: Partial<Tarea>): Tarea {
  return {
    id: 'tarea-1',
    titulo: 'Tarea de prueba',
    descripcion: null,
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    recurrencia: 'NINGUNA',
    tiempoEstimadoMinutos: null,
    subtareas: [],
    etiquetas: [],
    objetivoId: null,
    usuarioId: 'usuario-1',
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

describe('tareasSlice', () => {
  it('cargarTareas.pending marca cargando y limpia errores previos', () => {
    const previo = reductor(undefined, { type: '@@INIT' });
    const estado = reductor(
      { ...previo, error: 'error anterior' },
      { type: cargarTareas.pending.type },
    );
    expect(estado.cargando).toBe(true);
    expect(estado.error).toBeNull();
  });

  it('cargarTareas.fulfilled reemplaza la lista y apaga cargando', () => {
    const tareas = [crearTareaFalsa({ id: 'a' }), crearTareaFalsa({ id: 'b' })];
    const estado = reductor(undefined, cargarTareas.fulfilled(tareas, 'peticion-1', undefined));
    expect(estado.cargando).toBe(false);
    expect(estado.lista).toEqual(tareas);
  });

  it('cargarTareas.rejected guarda el mensaje de error', () => {
    const estado = reductor(
      undefined,
      cargarTareas.rejected(new Error('fallo'), 'peticion-1', undefined, 'No se pudieron cargar las tareas'),
    );
    expect(estado.cargando).toBe(false);
    expect(estado.error).toBe('No se pudieron cargar las tareas');
  });

  it('crearTarea.fulfilled añade la tarea nueva al principio de la lista', () => {
    const existente = crearTareaFalsa({ id: 'existente' });
    const previo = { lista: [existente], cargando: false, error: null };
    const nueva = crearTareaFalsa({ id: 'nueva' });

    const estado = reductor(
      previo,
      crearTarea.fulfilled(nueva, 'peticion-1', { titulo: nueva.titulo }),
    );

    expect(estado.lista).toEqual([nueva, existente]);
  });

  it('eliminarTarea.fulfilled quita la tarea de la lista', () => {
    const previo = {
      lista: [crearTareaFalsa({ id: 'a' }), crearTareaFalsa({ id: 'b' })],
      cargando: false,
      error: null,
    };

    const estado = reductor(previo, eliminarTarea.fulfilled('a', 'peticion-1', 'a'));

    expect(estado.lista.map((tarea) => tarea.id)).toEqual(['b']);
  });

  it('cambiarEstadoTarea.fulfilled actualiza solo la tarea afectada', () => {
    const previo = {
      lista: [crearTareaFalsa({ id: 'a', estado: 'POR_HACER' }), crearTareaFalsa({ id: 'b' })],
      cargando: false,
      error: null,
    };
    const actualizada = crearTareaFalsa({ id: 'a', estado: 'HECHA' });

    const estado = reductor(
      previo,
      cambiarEstadoTarea.fulfilled(actualizada, 'peticion-1', { id: 'a', estado: 'HECHA' }),
    );

    expect(estado.lista.find((tarea) => tarea.id === 'a')?.estado).toBe('HECHA');
    expect(estado.lista.find((tarea) => tarea.id === 'b')?.estado).toBe('POR_HACER');
  });

  describe('subtareas', () => {
    it('crearSubtareaTarea.fulfilled añade la subtarea a la tarea correspondiente', () => {
      const previo = {
        lista: [crearTareaFalsa({ id: 'tarea-1' }), crearTareaFalsa({ id: 'tarea-2' })],
        cargando: false,
        error: null,
      };
      const subtarea = crearSubtareaFalsa({ id: 'nueva', tareaId: 'tarea-1' });

      const estado = reductor(
        previo,
        crearSubtareaTarea.fulfilled(
          { tareaId: 'tarea-1', subtarea },
          'peticion-1',
          { tareaId: 'tarea-1', titulo: subtarea.titulo },
        ),
      );

      expect(estado.lista.find((t) => t.id === 'tarea-1')?.subtareas).toEqual([subtarea]);
      expect(estado.lista.find((t) => t.id === 'tarea-2')?.subtareas).toEqual([]);
    });

    it('cambiarSubtarea.fulfilled actualiza solo la subtarea afectada', () => {
      const previo = {
        lista: [
          crearTareaFalsa({
            id: 'tarea-1',
            subtareas: [
              crearSubtareaFalsa({ id: 'a', completada: false }),
              crearSubtareaFalsa({ id: 'b', completada: false }),
            ],
          }),
        ],
        cargando: false,
        error: null,
      };
      const actualizada = crearSubtareaFalsa({ id: 'a', completada: true });

      const estado = reductor(
        previo,
        cambiarSubtarea.fulfilled(
          { tareaId: 'tarea-1', subtarea: actualizada },
          'peticion-1',
          { id: 'a', tareaId: 'tarea-1', completada: true },
        ),
      );

      const subtareas = estado.lista[0].subtareas;
      expect(subtareas.find((s) => s.id === 'a')?.completada).toBe(true);
      expect(subtareas.find((s) => s.id === 'b')?.completada).toBe(false);
    });

    it('eliminarSubtareaTarea.fulfilled quita la subtarea de la tarea correspondiente', () => {
      const previo = {
        lista: [
          crearTareaFalsa({
            id: 'tarea-1',
            subtareas: [crearSubtareaFalsa({ id: 'a' }), crearSubtareaFalsa({ id: 'b' })],
          }),
        ],
        cargando: false,
        error: null,
      };

      const estado = reductor(
        previo,
        eliminarSubtareaTarea.fulfilled(
          { tareaId: 'tarea-1', id: 'a' },
          'peticion-1',
          { id: 'a', tareaId: 'tarea-1' },
        ),
      );

      expect(estado.lista[0].subtareas.map((s) => s.id)).toEqual(['b']);
    });
  });
});
