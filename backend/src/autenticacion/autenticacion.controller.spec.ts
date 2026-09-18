import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';

describe('AutenticacionController', () => {
  let controlador: AutenticacionController;
  const servicioFalso = {
    registrar: vi.fn(),
    iniciarSesion: vi.fn(),
    obtenerUsuarioPorId: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AutenticacionController],
      providers: [{ provide: AutenticacionService, useValue: servicioFalso }],
    }).compile();

    controlador = modulo.get(AutenticacionController);
  });

  it('registrar delega en el servicio con los datos del body', async () => {
    const datos = { correo: 'ana@example.com', contrasena: 'Abcdefg1' };
    servicioFalso.registrar.mockResolvedValue({ tokenAcceso: 'token' });

    const resultado = await controlador.registrar(datos);

    expect(servicioFalso.registrar).toHaveBeenCalledWith(datos);
    expect(resultado).toEqual({ tokenAcceso: 'token' });
  });

  it('iniciarSesion delega en el servicio con las credenciales', async () => {
    const datos = { correo: 'ana@example.com', contrasena: 'Abcdefg1' };
    servicioFalso.iniciarSesion.mockResolvedValue({ tokenAcceso: 'token' });

    const resultado = await controlador.iniciarSesion(datos);

    expect(servicioFalso.iniciarSesion).toHaveBeenCalledWith(datos);
    expect(resultado).toEqual({ tokenAcceso: 'token' });
  });

  it('obtenerPerfil consulta el perfil del usuario autenticado por la petición, no por datos sueltos', async () => {
    servicioFalso.obtenerUsuarioPorId.mockResolvedValue({ id: 'usuario-1' });

    await controlador.obtenerPerfil({ id: 'usuario-1', correo: 'ana@example.com' });

    expect(servicioFalso.obtenerUsuarioPorId).toHaveBeenCalledWith('usuario-1');
  });
});
