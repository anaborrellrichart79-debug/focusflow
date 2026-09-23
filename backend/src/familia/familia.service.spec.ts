import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { FamiliaService } from './familia.service.js';

const MANANA = new Date(Date.now() + 24 * 60 * 60 * 1000);
const AYER = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('FamiliaService', () => {
  let servicio: FamiliaService;
  const prismaFalso = {
    usuario: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    vinculoFamiliar: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    tarea: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    aviso: { create: vi.fn() },
    $transaction: vi.fn(async (operaciones: Promise<unknown>[]) =>
      Promise.all(operaciones),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.vinculoFamiliar.create.mockResolvedValue({ id: 'vinculo-1' });
    prismaFalso.tarea.update.mockResolvedValue({ id: 'tarea-1' });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliaService,
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();
    servicio = modulo.get(FamiliaService);
  });

  describe('código de vínculo', () => {
    it('genera un código de 6 caracteres sin letras ambiguas, válido 48 horas', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);

      const { codigo, expiraEn } = await servicio.generarCodigo('hija');

      expect(codigo).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      expect(expiraEn.getTime() - Date.now()).toBeGreaterThan(
        47 * 60 * 60 * 1000,
      );
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'hija' },
        data: { codigoVinculo: codigo, codigoVinculoExpiraEn: expiraEn },
      });
    });

    it('vincular con un código válido crea el vínculo y gasta el código', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({
        id: 'hija',
        nombre: 'Lucía',
        correo: 'l@example.com',
        codigoVinculoExpiraEn: MANANA,
      });
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue(null);

      const resultado = await servicio.vincular('mama', ' abc234 ');

      expect(prismaFalso.usuario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { codigoVinculo: 'ABC234' } }),
      );
      expect(prismaFalso.vinculoFamiliar.create).toHaveBeenCalledWith({
        data: { responsableId: 'mama', supervisadoId: 'hija' },
      });
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'hija' },
        data: { codigoVinculo: null, codigoVinculoExpiraEn: null },
      });
      expect(resultado).toEqual({
        vinculoId: 'vinculo-1',
        id: 'hija',
        nombre: 'Lucía',
        correo: 'l@example.com',
      });
    });

    it('rechaza un código caducado, inexistente o el propio', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValueOnce({
        id: 'hija',
        codigoVinculoExpiraEn: AYER,
      });
      await expect(servicio.vincular('mama', 'ABC234')).rejects.toThrow(
        BadRequestException,
      );

      prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);
      await expect(servicio.vincular('mama', 'ABC234')).rejects.toThrow(
        BadRequestException,
      );

      prismaFalso.usuario.findUnique.mockResolvedValueOnce({
        id: 'mama',
        codigoVinculoExpiraEn: MANANA,
      });
      await expect(servicio.vincular('mama', 'ABC234')).rejects.toThrow(
        BadRequestException,
      );

      expect(prismaFalso.vinculoFamiliar.create).not.toHaveBeenCalled();
    });

    it('no duplica un vínculo que ya existe', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({
        id: 'hija',
        codigoVinculoExpiraEn: MANANA,
      });
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue({
        id: 'vinculo-1',
      });

      await expect(servicio.vincular('mama', 'ABC234')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  it('desvincular quita al responsable como revisor de las tareas del supervisado', async () => {
    prismaFalso.vinculoFamiliar.findFirst.mockResolvedValue({
      id: 'vinculo-1',
      responsableId: 'mama',
      supervisadoId: 'hija',
    });

    await servicio.desvincular('hija', 'vinculo-1');

    expect(prismaFalso.vinculoFamiliar.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'vinculo-1',
        OR: [{ responsableId: 'hija' }, { supervisadoId: 'hija' }],
      },
    });
    expect(prismaFalso.tarea.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: 'hija', revisorId: 'mama' },
      data: { revisorId: null, estadoRevision: null, comentarioRevision: null },
    });
    expect(prismaFalso.vinculoFamiliar.delete).toHaveBeenCalledWith({
      where: { id: 'vinculo-1' },
    });
  });

  describe('tareas del supervisado', () => {
    it('sin vínculo no se ve nada', async () => {
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue(null);

      await expect(
        servicio.listarTareasSupervisado('extrano', 'hija'),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.tarea.findMany).not.toHaveBeenCalled();
    });

    it('el responsable solo ve las tareas que revisa o que asignó', async () => {
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue({
        id: 'vinculo-1',
      });

      await servicio.listarTareasSupervisado('mama', 'hija');

      expect(prismaFalso.tarea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'hija',
            OR: [{ revisorId: 'mama' }, { creadaPorId: 'mama' }],
          },
        }),
      );
    });

    it('asignar una tarea la crea en la cuenta del supervisado, con el responsable como revisor', async () => {
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue({
        id: 'vinculo-1',
      });

      await servicio.asignarTarea('mama', 'hija', {
        titulo: 'Leer el capítulo 3',
        ambito: 'ESCOLAR',
      });

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titulo: 'Leer el capítulo 3',
            ambito: 'ESCOLAR',
            usuarioId: 'hija',
            creadaPorId: 'mama',
            revisorId: 'mama',
          }),
        }),
      );
    });
  });

  describe('revisar', () => {
    const tareaPendiente = {
      id: 'tarea-1',
      titulo: 'Maqueta',
      usuarioId: 'hija',
      revisorId: 'mama',
      estadoRevision: 'PENDIENTE',
    };

    beforeEach(() => {
      prismaFalso.vinculoFamiliar.findUnique.mockResolvedValue({
        id: 'vinculo-1',
      });
      prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({
        nombre: null,
        correo: 'mama@example.com',
      });
    });

    it('aprobar la marca como aprobada y avisa al supervisado', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue(tareaPendiente);

      await servicio.revisar('mama', 'tarea-1', { decision: 'APROBADA' });

      expect(prismaFalso.tarea.update.mock.calls[0][0].data).toEqual({
        estadoRevision: 'APROBADA',
        comentarioRevision: null,
      });
      expect(prismaFalso.aviso.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuarioId: 'hija',
          tipo: 'REVISION_RESUELTA',
          datos: {
            titulo: 'Maqueta',
            nombre: 'mama@example.com',
            decision: 'APROBADA',
            comentario: null,
          },
        }),
      });
    });

    it('devolverla la vuelve a poner en marcha con el comentario', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValue(tareaPendiente);

      await servicio.revisar('mama', 'tarea-1', {
        decision: 'DEVUELTA',
        comentario: ' Falta Saturno ',
      });

      expect(prismaFalso.tarea.update.mock.calls[0][0].data).toEqual({
        estadoRevision: 'DEVUELTA',
        comentarioRevision: 'Falta Saturno',
        estado: 'EN_PROCESO',
      });
    });

    it('no se puede revisar una tarea que no está pendiente ni una que revisa otra persona', async () => {
      prismaFalso.tarea.findFirst.mockResolvedValueOnce({
        ...tareaPendiente,
        estadoRevision: 'APROBADA',
      });
      await expect(
        servicio.revisar('mama', 'tarea-1', { decision: 'APROBADA' }),
      ).rejects.toThrow(BadRequestException);

      prismaFalso.tarea.findFirst.mockResolvedValueOnce(null);
      await expect(
        servicio.revisar('otra', 'tarea-1', { decision: 'APROBADA' }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.tarea.findFirst).toHaveBeenLastCalledWith({
        where: { id: 'tarea-1', revisorId: 'otra' },
      });
      expect(prismaFalso.tarea.update).not.toHaveBeenCalled();
    });
  });
});
