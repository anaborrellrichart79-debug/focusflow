import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { SubtareasService } from './subtareas.service.js';

describe('SubtareasService', () => {
  let servicio: SubtareasService;
  const prismaFalso = {
    tarea: {
      findFirst: vi.fn(),
    },
    subtarea: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [SubtareasService, { provide: ServicioPrisma, useValue: prismaFalso }],
    }).compile();

    servicio = modulo.get(SubtareasService);
  });

  it('crear comprueba que la tarea padre es del usuario antes de crear la subtarea', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue({ id: 'tarea-1' });

    await servicio.crear('usuario-1', 'tarea-1', { titulo: 'Paso 1' });

    expect(prismaFalso.tarea.findFirst).toHaveBeenCalledWith({
      where: { id: 'tarea-1', usuarioId: 'usuario-1' },
      select: { id: true },
    });
    expect(prismaFalso.subtarea.create).toHaveBeenCalledWith({
      data: { titulo: 'Paso 1', tareaId: 'tarea-1' },
    });
  });

  it('crear en una tarea de otro usuario falla y no crea la subtarea', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue(null);

    await expect(
      servicio.crear('usuario-1', 'tarea-de-otro', { titulo: 'Intrusa' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.subtarea.create).not.toHaveBeenCalled();
  });

  describe('aislamiento por usuario (vía la tarea padre)', () => {
    it('actualizar no llega a modificar la subtarea si la tarea padre no es del usuario', async () => {
      prismaFalso.subtarea.findFirst.mockResolvedValue(null);

      await expect(
        servicio.actualizar('usuario-1', 'subtarea-de-otro', { completada: true }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.subtarea.update).not.toHaveBeenCalled();
    });

    it('eliminar no llega a borrar la subtarea si la tarea padre no es del usuario', async () => {
      prismaFalso.subtarea.findFirst.mockResolvedValue(null);

      await expect(servicio.eliminar('usuario-1', 'subtarea-de-otro')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaFalso.subtarea.delete).not.toHaveBeenCalled();
    });

    it('actualizar sí modifica la subtarea cuando la tarea padre es del usuario', async () => {
      prismaFalso.subtarea.findFirst.mockResolvedValue({ id: 'subtarea-1' });

      await servicio.actualizar('usuario-1', 'subtarea-1', { completada: true });

      expect(prismaFalso.subtarea.findFirst).toHaveBeenCalledWith({
        where: { id: 'subtarea-1', tarea: { usuarioId: 'usuario-1' } },
        select: { id: true },
      });
      expect(prismaFalso.subtarea.update).toHaveBeenCalledWith({
        where: { id: 'subtarea-1' },
        data: { completada: true },
      });
    });
  });
});
