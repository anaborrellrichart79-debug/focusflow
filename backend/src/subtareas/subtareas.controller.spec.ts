import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubtareasController } from './subtareas.controller.js';
import { SubtareasService } from './subtareas.service.js';

describe('SubtareasController', () => {
  let controlador: SubtareasController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const servicioFalso = {
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [SubtareasController],
      providers: [{ provide: SubtareasService, useValue: servicioFalso }],
    }).compile();

    controlador = modulo.get(SubtareasController);
  });

  it('crear pasa el usuario autenticado, el id de la tarea padre y el body', async () => {
    await controlador.crear(usuario, 'tarea-1', { titulo: 'Paso 1' });
    expect(servicioFalso.crear).toHaveBeenCalledWith('usuario-1', 'tarea-1', {
      titulo: 'Paso 1',
    });
  });

  it('actualizar pasa el usuario, el id de la subtarea y el body', async () => {
    await controlador.actualizar(usuario, 'subtarea-1', { completada: true });
    expect(servicioFalso.actualizar).toHaveBeenCalledWith('usuario-1', 'subtarea-1', {
      completada: true,
    });
  });

  it('eliminar pasa el usuario y el id de la subtarea', async () => {
    await controlador.eliminar(usuario, 'subtarea-1');
    expect(servicioFalso.eliminar).toHaveBeenCalledWith('usuario-1', 'subtarea-1');
  });
});
