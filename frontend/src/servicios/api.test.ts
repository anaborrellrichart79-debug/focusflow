import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorApi, establecerIdiomaErrores, peticionApi } from './api';

function responder(estado: number, cuerpo: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: estado < 400, status: estado, json: async () => cuerpo }));
}

async function errorDe(promesa: Promise<unknown>) {
  try {
    await promesa;
  } catch (error) {
    return error as ErrorApi;
  }
  throw new Error('La petición no ha fallado');
}

describe('peticionApi: errores traducidos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    establecerIdiomaErrores('es');
  });

  it('traduce el código del backend al idioma activo', async () => {
    establecerIdiomaErrores('en');
    responder(404, { statusCode: 404, message: 'Tarea no encontrada', codigo: 'TAREA_NO_ENCONTRADA' });

    const error = await errorDe(peticionApi('/tareas/x'));

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.message).toBe('Task not found');
    expect(error.codigo).toBe('TAREA_NO_ENCONTRADA');
    expect(error.estado).toBe(404);
  });

  it('en los errores de validación traduce cada mensaje con código y deja los demás como vienen', async () => {
    establecerIdiomaErrores('gl');
    responder(400, {
      message: ['La contraseña debe tener al menos 8 caracteres', 'titulo must be a string'],
      codigos: ['CONTRASENA_CORTA', null],
      codigo: 'CONTRASENA_CORTA',
    });

    const error = await errorDe(peticionApi('/autenticacion/registro'));

    expect(error.message).toBe('O contrasinal debe ter polo menos 8 caracteres, titulo must be a string');
  });

  it('sin código enseña el texto del servidor; un 500 da un mensaje genérico traducido', async () => {
    responder(400, { message: 'Algo concreto del servidor' });
    expect((await errorDe(peticionApi('/x'))).message).toBe('Algo concreto del servidor');

    establecerIdiomaErrores('ca');
    responder(500, { statusCode: 500, message: 'Internal server error' });
    expect((await errorDe(peticionApi('/x'))).message).toBe(
      'Hi ha hagut un error al servidor. Torna-ho a provar més tard.',
    );
  });

  it('si no se puede conectar con el servidor lo dice en el idioma activo', async () => {
    establecerIdiomaErrores('eu');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await errorDe(peticionApi('/x'));

    expect(error.codigo).toBe('SIN_CONEXION');
    expect(error.message).toBe('Ezin izan da zerbitzariarekin konektatu. Egiaztatu konexioa.');
  });
});
