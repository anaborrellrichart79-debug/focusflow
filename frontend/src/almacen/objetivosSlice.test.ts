import { describe, expect, it } from 'vitest';
import type { Objetivo } from '@/servicios/objetivos';
import reductor, { cargarObjetivos, crearObjetivo, eliminarObjetivo } from './objetivosSlice';

function crearObjetivoFalso(datos: Partial<Objetivo>): Objetivo {
  return {
    id: 'objetivo-1',
    titulo: 'Objetivo de prueba',
    descripcion: null,
    fechaLimite: null,
    ambito: 'PERSONAL',
    totalTareas: 0,
    tareasCompletadas: 0,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

describe('objetivosSlice', () => {
  it('cargarTareas.fulfilled reemplaza la lista y apaga cargando', () => {
    const objetivos = [crearObjetivoFalso({ id: 'a' }), crearObjetivoFalso({ id: 'b' })];
    const estado = reductor(
      undefined,
      cargarObjetivos.fulfilled(objetivos, 'peticion-1', undefined),
    );
    expect(estado.cargando).toBe(false);
    expect(estado.lista).toEqual(objetivos);
  });

  it('cargarObjetivos.rejected guarda el mensaje de error', () => {
    const estado = reductor(
      undefined,
      cargarObjetivos.rejected(
        new Error('fallo'),
        'peticion-1',
        undefined,
        'No se pudieron cargar los objetivos',
      ),
    );
    expect(estado.error).toBe('No se pudieron cargar los objetivos');
  });

  it('crearObjetivo.fulfilled añade el objetivo nuevo al principio, siempre con progreso en cero', () => {
    const existente = crearObjetivoFalso({ id: 'existente', totalTareas: 5, tareasCompletadas: 2 });
    const previo = { lista: [existente], cargando: false, error: null };
    const nuevo = crearObjetivoFalso({ id: 'nuevo', titulo: 'Recién creado' });

    const estado = reductor(
      previo,
      crearObjetivo.fulfilled(nuevo, 'peticion-1', { titulo: nuevo.titulo }),
    );

    expect(estado.lista[0]).toEqual({ ...nuevo, totalTareas: 0, tareasCompletadas: 0 });
    expect(estado.lista[1]).toEqual(existente);
  });

  it('eliminarObjetivo.fulfilled quita el objetivo de la lista', () => {
    const previo = {
      lista: [crearObjetivoFalso({ id: 'a' }), crearObjetivoFalso({ id: 'b' })],
      cargando: false,
      error: null,
    };

    const estado = reductor(previo, eliminarObjetivo.fulfilled('a', 'peticion-1', 'a'));

    expect(estado.lista.map((objetivo) => objetivo.id)).toEqual(['b']);
  });
});
