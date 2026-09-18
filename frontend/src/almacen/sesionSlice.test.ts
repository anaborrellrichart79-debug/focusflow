import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsuarioSesion } from '@/servicios/autenticacion';
import reductor, { cerrarSesion, iniciarSesionUsuario, restaurarSesion } from './sesionSlice';

const CLAVE_TOKEN = 'focusflow.tokenAcceso';

const usuarioFalso: UsuarioSesion = { id: 'usuario-1', correo: 'ana@example.com', nombre: 'Ana' };

describe('sesionSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sin token guardado, empieza sin restaurar sesión', () => {
    const estado = reductor(undefined, { type: '@@INIT' });
    expect(estado.restaurando).toBe(false);
    expect(estado.tokenAcceso).toBeNull();
  });

  it('con un token guardado antes de arrancar, empieza en modo "restaurando"', async () => {
    localStorage.setItem(CLAVE_TOKEN, 'token-guardado');
    vi.resetModules();

    const { default: reductorFresco } = await import('./sesionSlice');
    const estado = reductorFresco(undefined, { type: '@@INIT' });

    expect(estado.restaurando).toBe(true);
    expect(estado.tokenAcceso).toBe('token-guardado');
  });

  it('iniciarSesionUsuario.fulfilled guarda el usuario, el token y lo persiste', () => {
    const estado = reductor(
      undefined,
      iniciarSesionUsuario.fulfilled(
        { usuario: usuarioFalso, tokenAcceso: 'token-nuevo' },
        'peticion-1',
        { correo: usuarioFalso.correo, contrasena: 'Abcdefg1' },
      ),
    );

    expect(estado.usuario).toEqual(usuarioFalso);
    expect(estado.tokenAcceso).toBe('token-nuevo');
    expect(localStorage.getItem(CLAVE_TOKEN)).toBe('token-nuevo');
  });

  it('iniciarSesionUsuario.rejected guarda el mensaje de error', () => {
    const estado = reductor(
      undefined,
      iniciarSesionUsuario.rejected(
        new Error('fallo'),
        'peticion-1',
        { correo: usuarioFalso.correo, contrasena: 'mala' },
        'No se pudo iniciar sesión',
      ),
    );

    expect(estado.error).toBe('No se pudo iniciar sesión');
  });

  it('restaurarSesion.rejected limpia la sesión y borra el token guardado', () => {
    localStorage.setItem(CLAVE_TOKEN, 'token-caducado');
    const previo = {
      usuario: usuarioFalso,
      tokenAcceso: 'token-caducado',
      cargando: false,
      restaurando: true,
      error: null,
    };

    const estado = reductor(previo, restaurarSesion.rejected(new Error('fallo'), 'peticion-1', undefined, null));

    expect(estado.restaurando).toBe(false);
    expect(estado.usuario).toBeNull();
    expect(estado.tokenAcceso).toBeNull();
    expect(localStorage.getItem(CLAVE_TOKEN)).toBeNull();
  });

  it('cerrarSesion limpia el estado y borra el token guardado', () => {
    localStorage.setItem(CLAVE_TOKEN, 'token-activo');
    const previo = {
      usuario: usuarioFalso,
      tokenAcceso: 'token-activo',
      cargando: false,
      restaurando: false,
      error: null,
    };

    const estado = reductor(previo, cerrarSesion());

    expect(estado.usuario).toBeNull();
    expect(estado.tokenAcceso).toBeNull();
    expect(localStorage.getItem(CLAVE_TOKEN)).toBeNull();
  });
});
