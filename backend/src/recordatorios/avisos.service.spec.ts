import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { AvisosService } from './avisos.service.js';

describe('AvisosService', () => {
  let servicio: AvisosService;
  const prismaFalso = {
    aviso: { findMany: vi.fn(), updateMany: vi.fn() },
    tarea: { findFirst: vi.fn(), update: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.aviso.updateMany.mockResolvedValue({ count: 1 });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AvisosService,
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();
    servicio = modulo.get(AvisosService);
  });

  it('lista solo los avisos del usuario, del más nuevo al más antiguo', async () => {
    await servicio.listar('usuario-1');

    expect(prismaFalso.aviso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: 'usuario-1' },
        orderBy: { creadoEn: 'desc' },
      }),
    );
  });

  it('marcar como leído un aviso de otro usuario da 404', async () => {
    prismaFalso.aviso.updateMany.mockResolvedValue({ count: 0 });

    await expect(servicio.marcarLeido('usuario-1', 'ajeno')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('marcar una tarea como revisada reinicia su contador y cierra sus alarmas', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue({ id: 'tarea-1' });

    await servicio.marcarTareaRevisada('usuario-1', 'tarea-1');

    expect(prismaFalso.tarea.findFirst).toHaveBeenCalledWith({
      where: { id: 'tarea-1', usuarioId: 'usuario-1' },
    });
    expect(prismaFalso.tarea.update).toHaveBeenCalledWith({
      where: { id: 'tarea-1' },
      data: { actualizadoEn: expect.any(Date) },
    });
    expect(prismaFalso.aviso.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          usuarioId: 'usuario-1',
          tareaId: 'tarea-1',
          tipo: 'EMERGENCIA',
          leidoEn: null,
        },
      }),
    );
  });

  it('no deja marcar como revisada una tarea de otro usuario', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue(null);

    await expect(
      servicio.marcarTareaRevisada('usuario-1', 'ajena'),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.tarea.update).not.toHaveBeenCalled();
  });
});
