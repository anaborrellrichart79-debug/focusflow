import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { ObjetivosService } from './objetivos.service.js';

describe('ObjetivosService', () => {
  let servicio: ObjetivosService;
  const prismaFalso = {
    objetivo: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [ObjetivosService, { provide: ServicioPrisma, useValue: prismaFalso }],
    }).compile();

    servicio = modulo.get(ObjetivosService);
  });

  it('crear asocia el objetivo al usuario que lo crea', async () => {
    await servicio.crear('usuario-1', { titulo: 'Aprender TypeScript' });

    expect(prismaFalso.objetivo.create).toHaveBeenCalledWith({
      data: {
        titulo: 'Aprender TypeScript',
        descripcion: undefined,
        fechaLimite: undefined,
        ambito: undefined,
        usuarioId: 'usuario-1',
      },
    });
  });

  it('crear pasa la fechaLimite tal cual a Prisma', async () => {
    const fechaLimite = new Date('2026-12-31T00:00:00.000Z');

    await servicio.crear('usuario-1', { titulo: 'Con fecha', fechaLimite });

    expect(prismaFalso.objetivo.create).toHaveBeenCalledWith({
      data: {
        titulo: 'Con fecha',
        descripcion: undefined,
        fechaLimite,
        ambito: undefined,
        usuarioId: 'usuario-1',
      },
    });
  });

  it('crear un objetivo escolar guarda el ambito', async () => {
    await servicio.crear('usuario-1', { titulo: 'Aprobar el curso', ambito: 'ESCOLAR' });

    expect(prismaFalso.objetivo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ambito: 'ESCOLAR' }),
    });
  });

  it('listarPorUsuario calcula el progreso a partir de las tareas incluidas', async () => {
    prismaFalso.objetivo.findMany.mockResolvedValue([
      {
        id: 'objetivo-1',
        titulo: 'Con progreso',
        tareas: [{ estado: 'HECHA' }, { estado: 'HECHA' }, { estado: 'POR_HACER' }],
      },
      { id: 'objetivo-2', titulo: 'Sin tareas', tareas: [] },
    ]);

    const resultado = await servicio.listarPorUsuario('usuario-1');

    expect(resultado).toEqual([
      { id: 'objetivo-1', titulo: 'Con progreso', totalTareas: 3, tareasCompletadas: 2 },
      { id: 'objetivo-2', titulo: 'Sin tareas', totalTareas: 0, tareasCompletadas: 0 },
    ]);
  });

  describe('aislamiento por usuario', () => {
    it('obtenerUno lanza NotFoundException si el objetivo es de otro usuario', async () => {
      prismaFalso.objetivo.findFirst.mockResolvedValue(null);

      await expect(servicio.obtenerUno('usuario-1', 'objetivo-de-otro')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaFalso.objetivo.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'objetivo-de-otro', usuarioId: 'usuario-1' } }),
      );
    });

    it('actualizar no llega a modificar el objetivo si no pertenece al usuario', async () => {
      prismaFalso.objetivo.findFirst.mockResolvedValue(null);

      await expect(
        servicio.actualizar('usuario-1', 'objetivo-de-otro', { titulo: 'Intento de robo' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.objetivo.update).not.toHaveBeenCalled();
    });

    it('eliminar no llega a borrar el objetivo si no pertenece al usuario', async () => {
      prismaFalso.objetivo.findFirst.mockResolvedValue(null);

      await expect(servicio.eliminar('usuario-1', 'objetivo-de-otro')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaFalso.objetivo.delete).not.toHaveBeenCalled();
    });

    it('actualizar sí modifica el objetivo cuando pertenece al usuario', async () => {
      prismaFalso.objetivo.findFirst.mockResolvedValue({ id: 'objetivo-1' });
      prismaFalso.objetivo.update.mockResolvedValue({ id: 'objetivo-1', titulo: 'Actualizado' });

      const resultado = await servicio.actualizar('usuario-1', 'objetivo-1', {
        titulo: 'Actualizado',
      });

      expect(resultado).toEqual({ id: 'objetivo-1', titulo: 'Actualizado' });
      expect(prismaFalso.objetivo.update).toHaveBeenCalledWith({
        where: { id: 'objetivo-1' },
        data: { titulo: 'Actualizado' },
      });
    });
  });
});
