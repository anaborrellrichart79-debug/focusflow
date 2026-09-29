import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, NotFoundException, UnauthorizedException, type ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { codigoDeMensaje, MENSAJES_ERROR } from './errores.js';

const CODIGOS_POR_ESTADO = ['NO_AUTENTICADO', 'SIN_PERMISO', 'NO_ENCONTRADO'];
// Los que solo pone el frontend (sin conexión, error 500 sin código...).
const CODIGOS_DEL_FRONTEND = ['SIN_CONEXION', 'ERROR_INTERNO', 'ERROR_DESCONOCIDO'];
import { FiltroErrores } from './filtro-errores.js';

function ficherosTs(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return nombre === 'generated' ? [] : ficherosTs(ruta);
    return ruta.endsWith('.ts') && !ruta.endsWith('.spec.ts') ? [ruta] : [];
  });
}

function responder(excepcion: Parameters<FiltroErrores['catch']>[0]) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new FiltroErrores().catch(excepcion, host);
  return { estado: (status.mock.calls[0] as unknown[])[0], cuerpo: json.mock.calls[0][0] };
}

describe('catálogo de errores', () => {
  it('todos los mensajes de error del código están en el catálogo (si no, el frontend no los traduce)', () => {
    const fuera: string[] = [];
    let encontrados = 0;
    for (const fichero of ficherosTs(join(import.meta.dirname, '..'))) {
      const texto = readFileSync(fichero, 'utf-8');
      const patrones = [/new\s+\w+Exception\(\s*'([^']*)'/g, /message:\s*'([^']*)'/g];
      for (const patron of patrones) {
        for (const [, mensaje] of texto.matchAll(patron)) {
          encontrados++;
          if (!codigoDeMensaje(mensaje)) fuera.push(`${fichero}: ${mensaje}`);
        }
      }
    }
    // Por si el recorrido dejara de encontrar ficheros y el test pasara en vacío.
    expect(encontrados).toBeGreaterThan(50);
    expect(fuera).toEqual([]);
  });

  it('cada código está traducido en los 6 idiomas del frontend', () => {
    const codigos = [...Object.keys(MENSAJES_ERROR), ...CODIGOS_POR_ESTADO, ...CODIGOS_DEL_FRONTEND];
    const carpetaIdiomas = join(import.meta.dirname, '../../../frontend/src/idiomas');
    const faltan = ['es', 'va', 'gl', 'eu', 'ca', 'en'].flatMap((idioma) => {
      const texto = readFileSync(join(carpetaIdiomas, `${idioma}.ts`), 'utf-8');
      return codigos.filter((codigo) => !texto.includes(`'error.${codigo}':`)).map((codigo) => `${idioma}: ${codigo}`);
    });
    expect(faltan).toEqual([]);
  });

  it('no repite mensajes (cada texto tiene un solo código)', () => {
    const mensajes = Object.values(MENSAJES_ERROR);
    expect(new Set(mensajes).size).toBe(mensajes.length);
  });
});

describe('FiltroErrores', () => {
  it('añade el código del catálogo sin cambiar el resto de la respuesta', () => {
    const { estado, cuerpo } = responder(new NotFoundException('Tarea no encontrada'));

    expect(estado).toBe(404);
    expect(cuerpo).toEqual({
      statusCode: 404,
      message: 'Tarea no encontrada',
      error: 'Not Found',
      codigo: 'TAREA_NO_ENCONTRADA',
    });
  });

  it('en los errores de validación da un código por mensaje', () => {
    const { cuerpo } = responder(
      new BadRequestException(['La contraseña debe tener al menos 8 caracteres', 'titulo must be a string']),
    );

    expect(cuerpo.codigos).toEqual(['CONTRASENA_CORTA', null]);
    expect(cuerpo.codigo).toBe('CONTRASENA_CORTA');
  });

  it('los errores propios de Nest/Passport llevan un código por estado', () => {
    expect(responder(new UnauthorizedException()).cuerpo.codigo).toBe('NO_AUTENTICADO');
    expect(responder(new BadRequestException('algo raro')).cuerpo.codigo).toBeUndefined();
  });
});
