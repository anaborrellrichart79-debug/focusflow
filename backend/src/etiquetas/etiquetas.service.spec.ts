import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { EtiquetasService } from './etiquetas.service.js';

// Estudio › Matemáticas › Cálculo, y Lectura suelta.
const ARBOL = [
  { id: 'estudio', padreId: null },
  { id: 'mates', padreId: 'estudio' },
  { id: 'calculo', padreId: 'mates' },
  { id: 'lectura', padreId: null },
];

describe('EtiquetasService', () => {
  let servicio: EtiquetasService;
  const prismaFalso = {
    etiqueta: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (operaciones: Promise<unknown>[]) => Promise.all(operaciones)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.etiqueta.findUnique.mockResolvedValue(null);

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

  describe('crear', () => {
    it('crea una subetiqueta dentro de otra', async () => {
      prismaFalso.etiqueta.findMany.mockResolvedValue(ARBOL);

      await servicio.crear('usuario-1', { nombre: ' Álgebra ', padreId: 'mates' });

      expect(prismaFalso.etiqueta.create).toHaveBeenCalledWith({
        data: { nombre: 'Álgebra', padreId: 'mates', usuarioId: 'usuario-1' },
      });
    });

    it('no deja pasar del tercer nivel', async () => {
      prismaFalso.etiqueta.findMany.mockResolvedValue(ARBOL);

      await expect(
        servicio.crear('usuario-1', { nombre: 'Integrales', padreId: 'calculo' }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaFalso.etiqueta.create).not.toHaveBeenCalled();
    });

    it('rechaza un nombre repetido o un padre que no es del usuario', async () => {
      prismaFalso.etiqueta.findUnique.mockResolvedValueOnce({ id: 'otra' });
      await expect(servicio.crear('usuario-1', { nombre: 'Lectura' })).rejects.toThrow(
        ConflictException,
      );

      prismaFalso.etiqueta.findMany.mockResolvedValue(ARBOL);
      await expect(servicio.crear('usuario-1', { nombre: 'X', padreId: 'ajena' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mover', () => {
    beforeEach(() => {
      prismaFalso.etiqueta.findMany.mockResolvedValue(ARBOL);
    });

    it('mueve una etiqueta con todo lo que cuelga de ella si cabe', async () => {
      await servicio.actualizar('usuario-1', 'lectura', { padreId: 'mates' });

      expect(prismaFalso.etiqueta.update).toHaveBeenCalledWith({
        where: { id: 'lectura' },
        data: { nombre: undefined, padreId: 'mates' },
      });
    });

    it('no deja meter una rama que no cabe en 3 niveles', async () => {
      // Matemáticas (con Cálculo dentro) bajo Lectura son 3 niveles: cabe.
      await servicio.actualizar('usuario-1', 'mates', { padreId: 'lectura' });
      // Estudio (3 niveles de alto) bajo Lectura serían 4: no cabe.
      await expect(
        servicio.actualizar('usuario-1', 'estudio', { padreId: 'lectura' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('no deja meter una etiqueta dentro de sí misma ni de sus descendientes', async () => {
      await expect(
        servicio.actualizar('usuario-1', 'mates', { padreId: 'mates' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        servicio.actualizar('usuario-1', 'estudio', { padreId: 'calculo' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('padreId null la saca al primer nivel', async () => {
      await servicio.actualizar('usuario-1', 'calculo', { padreId: null });

      expect(prismaFalso.etiqueta.update).toHaveBeenCalledWith({
        where: { id: 'calculo' },
        data: { nombre: undefined, padreId: null },
      });
    });
  });

  it('eliminar sube un nivel a sus subetiquetas', async () => {
    prismaFalso.etiqueta.findFirst.mockResolvedValue({ id: 'mates', padreId: 'estudio' });

    await servicio.eliminar('usuario-1', 'mates');

    expect(prismaFalso.etiqueta.updateMany).toHaveBeenCalledWith({
      where: { padreId: 'mates', usuarioId: 'usuario-1' },
      data: { padreId: 'estudio' },
    });
    expect(prismaFalso.etiqueta.delete).toHaveBeenCalledWith({ where: { id: 'mates' } });
  });
});
