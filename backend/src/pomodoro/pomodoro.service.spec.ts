import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { PomodoroService } from './pomodoro.service.js';

describe('PomodoroService', () => {
  let servicio: PomodoroService;
  const prismaFalso = {
    sesionPomodoro: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    tarea: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [PomodoroService, { provide: ServicioPrisma, useValue: prismaFalso }],
    }).compile();

    servicio = modulo.get(PomodoroService);
  });

  it('registra una sesión sin tarea asociada sin comprobar ningún objetivo/tarea', async () => {
    await servicio.registrarSesion('usuario-1', { fase: 'TRABAJO', duracionSegundos: 1500 });

    expect(prismaFalso.tarea.findFirst).not.toHaveBeenCalled();
    expect(prismaFalso.sesionPomodoro.create).toHaveBeenCalledWith({
      data: {
        fase: 'TRABAJO',
        duracionSegundos: 1500,
        tareaId: undefined,
        usuarioId: 'usuario-1',
      },
    });
  });

  it('rechaza asociar la sesión a una tarea de otro usuario y no la crea', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue(null);

    await expect(
      servicio.registrarSesion('usuario-1', {
        fase: 'TRABAJO',
        duracionSegundos: 1500,
        tareaId: 'tarea-de-otro',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.sesionPomodoro.create).not.toHaveBeenCalled();
  });

  it('listarPorUsuario solo pide las sesiones del usuario, con la tarea asociada incluida', async () => {
    prismaFalso.sesionPomodoro.findMany.mockResolvedValue([]);

    await servicio.listarPorUsuario('usuario-1');

    expect(prismaFalso.sesionPomodoro.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: 'usuario-1' } }),
    );
  });
});
