import { describe, expect, it } from 'vitest';
import type { ResumenSincronizacionGoogle } from '@/servicios/google';
import reductor, {
  cargarEstadoGoogle,
  conectarConGoogle,
  desconectarGoogle,
  sincronizarGoogle,
} from './googleSlice';

describe('googleSlice', () => {
  it('cargarEstadoGoogle.fulfilled guarda si está conectado y la última sincronización', () => {
    const estado = reductor(
      undefined,
      cargarEstadoGoogle.fulfilled(
        { conectado: true, ultimaSincronizacion: '2026-09-21T18:00:00.000Z' },
        'peticion-1',
        undefined,
      ),
    );

    expect(estado.conectado).toBe(true);
    expect(estado.ultimaSincronizacion).toBe('2026-09-21T18:00:00.000Z');
    expect(estado.cargandoEstado).toBe(false);
  });

  it('conectarConGoogle.rejected guarda el mensaje de error sin tocar el estado de conexión', () => {
    const estado = reductor(
      undefined,
      conectarConGoogle.rejected(
        new Error('fallo'),
        'peticion-1',
        undefined,
        'No se pudo iniciar la conexión con Google',
      ),
    );

    expect(estado.error).toBe('No se pudo iniciar la conexión con Google');
    expect(estado.conectado).toBe(false);
  });

  it('sincronizarGoogle.pending activa "sincronizando" y limpia el error previo', () => {
    const previo = { ...reductor(undefined, { type: '@@INIT' }), error: 'error viejo' };

    const estado = reductor(previo, sincronizarGoogle.pending('peticion-1', undefined));

    expect(estado.sincronizando).toBe(true);
    expect(estado.error).toBeNull();
  });

  it('sincronizarGoogle.fulfilled guarda el resumen y marca la cuenta como conectada', () => {
    const resumen: ResumenSincronizacionGoogle = {
      creados: 2,
      actualizados: 1,
      eliminados: 0,
      importados: 3,
    };

    const estado = reductor(undefined, sincronizarGoogle.fulfilled(resumen, 'peticion-1', undefined));

    expect(estado.sincronizando).toBe(false);
    expect(estado.conectado).toBe(true);
    expect(estado.ultimoResumen).toEqual(resumen);
    expect(estado.ultimaSincronizacion).not.toBeNull();
  });

  it('sincronizarGoogle.rejected apaga "sincronizando" y guarda el error', () => {
    const estado = reductor(
      undefined,
      sincronizarGoogle.rejected(
        new Error('fallo'),
        'peticion-1',
        undefined,
        'No se pudo sincronizar con Google Calendar',
      ),
    );

    expect(estado.sincronizando).toBe(false);
    expect(estado.error).toBe('No se pudo sincronizar con Google Calendar');
  });

  it('desconectarGoogle.fulfilled limpia la conexión y el resumen', () => {
    const previo = {
      conectado: true,
      ultimaSincronizacion: '2026-09-21T18:00:00.000Z',
      sincronizando: false,
      cargandoEstado: false,
      ultimoResumen: { creados: 1, actualizados: 0, eliminados: 0, importados: 0 },
      error: null,
    };

    const estado = reductor(previo, desconectarGoogle.fulfilled(undefined, 'peticion-1', undefined));

    expect(estado.conectado).toBe(false);
    expect(estado.ultimaSincronizacion).toBeNull();
    expect(estado.ultimoResumen).toBeNull();
  });
});
