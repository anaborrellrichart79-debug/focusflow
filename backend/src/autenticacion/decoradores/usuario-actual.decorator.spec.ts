import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { obtenerUsuarioActual } from './usuario-actual.decorator.js';

function crearContextoFalso(usuario: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: usuario }),
    }),
  } as unknown as ExecutionContext;
}

describe('obtenerUsuarioActual (fábrica de @UsuarioActual)', () => {
  it('devuelve el usuario que EstrategiaJwt dejó en request.user tras validar el token', () => {
    const usuario = { id: 'usuario-1', correo: 'ana@example.com' };

    const resultado = obtenerUsuarioActual(undefined, crearContextoFalso(usuario));

    expect(resultado).toBe(usuario);
  });
});
