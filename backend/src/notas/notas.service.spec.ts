import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { NotasService } from './notas.service.js';

describe('NotasService', () => {
  let servicio: NotasService;
  const prismaFalso = {
    nota: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tarea: { findFirst: vi.fn() },
    objetivo: { findFirst: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.tarea.findFirst.mockResolvedValue({ id: 'tarea-1' });
    prismaFalso.objetivo.findFirst.mockResolvedValue({ id: 'objetivo-1' });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        NotasService,
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();
    servicio = modulo.get(NotasService);
  });

  it('lista las del usuario con sus filtros, pendientes primero', async () => {
    await servicio.listar('usuario-1', {
      tipo: 'TODO',
      objetivoId: 'objetivo-1',
    });

    expect(prismaFalso.nota.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          usuarioId: 'usuario-1',
          tipo: 'TODO',
          tareaId: undefined,
          objetivoId: 'objetivo-1',
        },
        orderBy: [{ completada: 'asc' }, { creadoEn: 'desc' }],
      }),
    );
  });

  it('un to-do lleva casilla siempre; una nota, solo si se pide', async () => {
    await servicio.crear('usuario-1', {
      tipo: 'TODO',
      contenido: 'Comprar cartulina',
    });
    await servicio.crear('usuario-1', {
      tipo: 'NOTA',
      contenido: 'Idea para la maqueta',
      tareaId: 'tarea-1',
    });

    expect(prismaFalso.nota.create.mock.calls[0][0].data).toMatchObject({
      tipo: 'TODO',
      conCasilla: true,
    });
    expect(prismaFalso.nota.create.mock.calls[1][0].data).toMatchObject({
      tipo: 'NOTA',
      conCasilla: false,
      tareaId: 'tarea-1',
    });
  });

  it('no deja asociarla a una tarea de otro usuario', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue(null);

    await expect(
      servicio.crear('usuario-1', {
        tipo: 'NOTA',
        contenido: 'x',
        tareaId: 'ajena',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.tarea.findFirst).toHaveBeenCalledWith({
      where: { id: 'ajena', usuarioId: 'usuario-1' },
    });
    expect(prismaFalso.nota.create).not.toHaveBeenCalled();
  });

  it('quitar la casilla de una nota la desmarca; a un to-do no se le puede quitar', async () => {
    prismaFalso.nota.findFirst.mockResolvedValueOnce({
      id: 'n-1',
      tipo: 'NOTA',
    });
    await servicio.actualizar('usuario-1', 'n-1', { conCasilla: false });
    expect(prismaFalso.nota.update.mock.calls[0][0].data).toMatchObject({
      conCasilla: false,
      completada: false,
    });

    prismaFalso.nota.findFirst.mockResolvedValueOnce({
      id: 't-1',
      tipo: 'TODO',
    });
    await expect(
      servicio.actualizar('usuario-1', 't-1', { conCasilla: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('no toca notas de otro usuario', async () => {
    prismaFalso.nota.findFirst.mockResolvedValue(null);

    await expect(servicio.eliminar('usuario-1', 'ajena')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaFalso.nota.delete).not.toHaveBeenCalled();
  });
});
