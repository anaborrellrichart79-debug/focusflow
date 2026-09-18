import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { TareasService } from './tareas.service.js';

describe('TareasService', () => {
  let servicio: TareasService;
  const prismaFalso = {
    tarea: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    objetivo: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [TareasService, { provide: ServicioPrisma, useValue: prismaFalso }],
    }).compile();

    servicio = modulo.get(TareasService);
  });

  it('crear una tarea suelta (sin objetivoId) no comprueba ningún objetivo', async () => {
    await servicio.crear('usuario-1', { titulo: 'Tarea suelta' });

    expect(prismaFalso.objetivo.findFirst).not.toHaveBeenCalled();
    expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
      data: { titulo: 'Tarea suelta', descripcion: undefined, objetivoId: undefined, usuarioId: 'usuario-1' },
    });
  });

  it('crear una tarea dentro de un objetivo de otro usuario falla y no crea la tarea', async () => {
    prismaFalso.objetivo.findFirst.mockResolvedValue(null);

    await expect(
      servicio.crear('usuario-1', { titulo: 'Intrusa', objetivoId: 'objetivo-de-otro' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.tarea.create).not.toHaveBeenCalled();
  });

  describe('aislamiento por usuario', () => {
    it('obtenerUna lanza NotFoundException si la tarea es de otro usuario', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue(null);

      await expect(servicio.obtenerUna('usuario-1', 'tarea-de-otro')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('actualizar no llega a modificar la tarea si no pertenece al usuario', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue(null);

      await expect(
        servicio.actualizar('usuario-1', 'tarea-de-otro', { estado: 'HECHA' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.tarea.update).not.toHaveBeenCalled();
    });

    it('eliminar no llega a borrar la tarea si no pertenece al usuario', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue(null);

      await expect(servicio.eliminar('usuario-1', 'tarea-de-otro')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaFalso.tarea.delete).not.toHaveBeenCalled();
    });

    it('actualizar rechaza mover la tarea a un objetivo que no es del usuario', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue({ id: 'tarea-1' });
      prismaFalso.objetivo.findFirst.mockResolvedValue(null);

      await expect(
        servicio.actualizar('usuario-1', 'tarea-1', { objetivoId: 'objetivo-de-otro' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.tarea.update).not.toHaveBeenCalled();
    });
  });

  it('listarPorUsuario aplica los filtros de objetivo y estado junto al usuario', async () => {
    prismaFalso.tarea.findMany.mockResolvedValue([]);

    await servicio.listarPorUsuario('usuario-1', { objetivoId: 'objetivo-1', estado: 'HECHA' });

    expect(prismaFalso.tarea.findMany).toHaveBeenCalledWith({
      where: { usuarioId: 'usuario-1', objetivoId: 'objetivo-1', estado: 'HECHA' },
      orderBy: { creadoEn: 'desc' },
    });
  });
});
