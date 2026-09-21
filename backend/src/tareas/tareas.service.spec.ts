import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { TareasService } from './tareas.service.js';

const INCLUIR_RELACIONES = {
  subtareas: { orderBy: { creadoEn: 'asc' as const } },
  etiquetas: true,
};

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
      data: {
        titulo: 'Tarea suelta',
        descripcion: undefined,
        objetivoId: undefined,
        fechaLimite: undefined,
        tiempoEstimadoMinutos: undefined,
        usuarioId: 'usuario-1',
        etiquetas: undefined,
      },
      include: INCLUIR_RELACIONES,
    });
  });

  it('crear una tarea con fechaLimite la pasa tal cual a Prisma', async () => {
    const fechaLimite = new Date('2026-12-31T00:00:00.000Z');

    await servicio.crear('usuario-1', { titulo: 'Con fecha', fechaLimite });

    expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
      data: {
        titulo: 'Con fecha',
        descripcion: undefined,
        objetivoId: undefined,
        fechaLimite,
        tiempoEstimadoMinutos: undefined,
        usuarioId: 'usuario-1',
        etiquetas: undefined,
      },
      include: INCLUIR_RELACIONES,
    });
  });

  it('crear una tarea con etiquetas las conecta o crea, limpiando espacios y duplicados', async () => {
    await servicio.crear('usuario-1', {
      titulo: 'Con etiquetas',
      etiquetas: ['casa', ' trabajo ', 'casa', '  '],
    });

    expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        etiquetas: {
          connectOrCreate: [
            {
              where: { usuarioId_nombre: { usuarioId: 'usuario-1', nombre: 'casa' } },
              create: { nombre: 'casa', usuarioId: 'usuario-1' },
            },
            {
              where: { usuarioId_nombre: { usuarioId: 'usuario-1', nombre: 'trabajo' } },
              create: { nombre: 'trabajo', usuarioId: 'usuario-1' },
            },
          ],
        },
      }),
      include: INCLUIR_RELACIONES,
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

  it('actualizar con etiquetas reemplaza el conjunto completo (set vacío + connectOrCreate)', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue({ id: 'tarea-1' });

    await servicio.actualizar('usuario-1', 'tarea-1', { etiquetas: ['urgente-personal'] });

    expect(prismaFalso.tarea.update).toHaveBeenCalledWith({
      where: { id: 'tarea-1' },
      data: {
        etiquetas: {
          set: [],
          connectOrCreate: [
            {
              where: { usuarioId_nombre: { usuarioId: 'usuario-1', nombre: 'urgente-personal' } },
              create: { nombre: 'urgente-personal', usuarioId: 'usuario-1' },
            },
          ],
        },
      },
      include: INCLUIR_RELACIONES,
    });
  });

  it('actualizar sin etiquetas no toca la relación de etiquetas', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue({
      id: 'tarea-1',
      estado: 'POR_HACER',
      recurrencia: 'NINGUNA',
    });

    await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

    expect(prismaFalso.tarea.update).toHaveBeenCalledWith({
      where: { id: 'tarea-1' },
      data: { estado: 'HECHA', etiquetas: undefined },
      include: INCLUIR_RELACIONES,
    });
  });

  describe('tareas recurrentes', () => {
    it('al completar una tarea con recurrencia DIARIA crea la siguiente ocurrencia un día después', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue({
        id: 'tarea-1',
        titulo: 'Regar las plantas',
        descripcion: null,
        objetivoId: null,
        urgente: false,
        importante: true,
        estado: 'POR_HACER',
        recurrencia: 'DIARIA',
        fechaLimite: new Date('2026-06-15T12:00:00.000Z'),
      });

      await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
        data: {
          titulo: 'Regar las plantas',
          descripcion: null,
          objetivoId: null,
          urgente: false,
          importante: true,
          recurrencia: 'DIARIA',
          fechaLimite: new Date('2026-06-16T12:00:00.000Z'),
          usuarioId: 'usuario-1',
        },
      });
    });

    it('al completar una tarea con recurrencia SEMANAL crea la siguiente ocurrencia siete días después', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue({
        id: 'tarea-1',
        titulo: 'Revisión semanal',
        descripcion: null,
        objetivoId: null,
        urgente: false,
        importante: false,
        estado: 'POR_HACER',
        recurrencia: 'SEMANAL',
        fechaLimite: new Date('2026-06-15T12:00:00.000Z'),
      });

      await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurrencia: 'SEMANAL',
          fechaLimite: new Date('2026-06-22T12:00:00.000Z'),
        }),
      });
    });

    it('sin fechaLimite previa, la siguiente ocurrencia parte de hoy', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

      prismaFalso.tarea.findFirst.mockResolvedValue({
        id: 'tarea-1',
        titulo: 'Hábito sin fecha',
        descripcion: null,
        objetivoId: null,
        urgente: false,
        importante: false,
        estado: 'POR_HACER',
        recurrencia: 'DIARIA',
        fechaLimite: null,
      });

      await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fechaLimite: new Date('2026-06-16T12:00:00.000Z'),
        }),
      });

      vi.useRealTimers();
    });

    it('completar una tarea sin recurrencia no crea ninguna ocurrencia nueva', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue({
        id: 'tarea-1',
        estado: 'POR_HACER',
        recurrencia: 'NINGUNA',
      });

      await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

      expect(prismaFalso.tarea.create).not.toHaveBeenCalled();
    });

    it('volver a marcar como HECHA una tarea que ya estaba HECHA no duplica la siguiente ocurrencia', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue({
        id: 'tarea-1',
        estado: 'HECHA',
        recurrencia: 'DIARIA',
        fechaLimite: new Date('2026-06-15T12:00:00.000Z'),
      });

      await servicio.actualizar('usuario-1', 'tarea-1', { estado: 'HECHA' });

      expect(prismaFalso.tarea.create).not.toHaveBeenCalled();
    });
  });

  it('listarPorUsuario aplica los filtros de objetivo y estado junto al usuario', async () => {
    prismaFalso.tarea.findMany.mockResolvedValue([]);

    await servicio.listarPorUsuario('usuario-1', { objetivoId: 'objetivo-1', estado: 'HECHA' });

    expect(prismaFalso.tarea.findMany).toHaveBeenCalledWith({
      where: { usuarioId: 'usuario-1', objetivoId: 'objetivo-1', estado: 'HECHA' },
      include: INCLUIR_RELACIONES,
      orderBy: { creadoEn: 'desc' },
    });
  });
});
