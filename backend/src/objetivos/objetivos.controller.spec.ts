import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjetivosController } from './objetivos.controller.js';
import { ObjetivosService } from './objetivos.service.js';

describe('ObjetivosController', () => {
  let controlador: ObjetivosController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const servicioFalso = {
    crear: vi.fn(),
    listarPorUsuario: vi.fn(),
    obtenerUno: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ObjetivosController],
      providers: [{ provide: ObjetivosService, useValue: servicioFalso }],
    }).compile();

    controlador = modulo.get(ObjetivosController);
  });

  it('crear pasa el id del usuario autenticado, no uno que venga en el body', async () => {
    await controlador.crear(usuario, { titulo: 'Objetivo nuevo' });
    expect(servicioFalso.crear).toHaveBeenCalledWith('usuario-1', { titulo: 'Objetivo nuevo' });
  });

  it('listar solo pide los objetivos del usuario autenticado', async () => {
    await controlador.listar(usuario);
    expect(servicioFalso.listarPorUsuario).toHaveBeenCalledWith('usuario-1');
  });

  it('obtenerUno pasa el usuario y el id de la ruta', async () => {
    await controlador.obtenerUno(usuario, 'objetivo-1');
    expect(servicioFalso.obtenerUno).toHaveBeenCalledWith('usuario-1', 'objetivo-1');
  });

  it('actualizar pasa el usuario, el id y los datos del body', async () => {
    await controlador.actualizar(usuario, 'objetivo-1', { titulo: 'Cambiado' });
    expect(servicioFalso.actualizar).toHaveBeenCalledWith('usuario-1', 'objetivo-1', {
      titulo: 'Cambiado',
    });
  });

  it('eliminar pasa el usuario y el id de la ruta', async () => {
    await controlador.eliminar(usuario, 'objetivo-1');
    expect(servicioFalso.eliminar).toHaveBeenCalledWith('usuario-1', 'objetivo-1');
  });
});
