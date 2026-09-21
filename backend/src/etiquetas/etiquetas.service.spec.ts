import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { EtiquetasService } from './etiquetas.service.js';

describe('EtiquetasService', () => {
  let servicio: EtiquetasService;
  const prismaFalso = {
    etiqueta: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [EtiquetasService, { provide: ServicioPrisma, useValue: prismaFalso }],
    }).compile();

    servicio = modulo.get(EtiquetasService);
  });

  it('listarPorUsuario filtra por el usuario y ordena por nombre', async () => {
    prismaFalso.etiqueta.findMany.mockResolvedValue([]);

    await servicio.listarPorUsuario('usuario-1');

    expect(prismaFalso.etiqueta.findMany).toHaveBeenCalledWith({
      where: { usuarioId: 'usuario-1' },
      orderBy: { nombre: 'asc' },
    });
  });
});
