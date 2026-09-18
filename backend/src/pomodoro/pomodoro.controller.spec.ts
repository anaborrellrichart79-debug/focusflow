import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PomodoroController } from './pomodoro.controller.js';
import { PomodoroService } from './pomodoro.service.js';

describe('PomodoroController', () => {
  let controlador: PomodoroController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const servicioFalso = {
    registrarSesion: vi.fn(),
    listarPorUsuario: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [PomodoroController],
      providers: [{ provide: PomodoroService, useValue: servicioFalso }],
    }).compile();

    controlador = modulo.get(PomodoroController);
  });

  it('registrar pasa el id del usuario autenticado y los datos del body', async () => {
    await controlador.registrar(usuario, { fase: 'TRABAJO', duracionSegundos: 1500 });
    expect(servicioFalso.registrarSesion).toHaveBeenCalledWith('usuario-1', {
      fase: 'TRABAJO',
      duracionSegundos: 1500,
    });
  });

  it('listar solo pide el historial del usuario autenticado', async () => {
    await controlador.listar(usuario);
    expect(servicioFalso.listarPorUsuario).toHaveBeenCalledWith('usuario-1');
  });
});
