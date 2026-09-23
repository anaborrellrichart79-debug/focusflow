import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { ASIGNATURAS, CURSOS } from './catalogo-lomloe.js';
import { CatalogoService } from './catalogo.service.js';

describe('CatalogoService', () => {
  let servicio: CatalogoService;
  const prismaFalso = {
    curso: { createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    asignatura: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.curso.createMany.mockResolvedValue({ count: 0 });
    prismaFalso.asignatura.createMany.mockResolvedValue({ count: 0 });
    prismaFalso.curso.findUnique.mockResolvedValue({ id: 'primaria-3' });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogoService,
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();

    servicio = modulo.get(CatalogoService);
  });

  it('al arrancar carga todo el catálogo sin duplicar lo que ya existe', async () => {
    await servicio.onModuleInit();

    expect(prismaFalso.curso.createMany).toHaveBeenCalledWith({
      data: CURSOS,
      skipDuplicates: true,
    });
    expect(prismaFalso.asignatura.createMany).toHaveBeenCalledWith({
      data: ASIGNATURAS,
      skipDuplicates: true,
    });
  });

  it('listarAsignaturas ofrece las comunes, la lengua de la comunidad indicada y las propias', async () => {
    await servicio.listarAsignaturas(
      'usuario-1',
      'primaria-3',
      'COMUNITAT_VALENCIANA',
    );

    expect(prismaFalso.asignatura.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cursoId: 'primaria-3',
          OR: [
            { usuarioId: null, comunidad: null },
            { usuarioId: null, comunidad: 'COMUNITAT_VALENCIANA' },
            { usuarioId: 'usuario-1' },
          ],
        },
      }),
    );
  });

  it('sin comunidad, no ofrece ninguna lengua autonómica', async () => {
    await servicio.listarAsignaturas('usuario-1', 'primaria-3');

    const { where } = prismaFalso.asignatura.findMany.mock.calls[0][0];
    expect(where.OR).toEqual([
      { usuarioId: null, comunidad: null },
      { usuarioId: 'usuario-1' },
    ]);
  });

  it('listarAsignaturas de un curso que no existe da 404', async () => {
    prismaFalso.curso.findUnique.mockResolvedValue(null);

    await expect(
      servicio.listarAsignaturas('usuario-1', 'no-existe'),
    ).rejects.toThrow(NotFoundException);
  });

  it('crearOptativaPropia la guarda como optativa del usuario', async () => {
    await servicio.crearOptativaPropia('usuario-1', {
      nombre: '  Ajedrez ',
      cursoId: 'primaria-3',
    });

    expect(prismaFalso.asignatura.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Ajedrez',
        categoria: 'OPTATIVA',
        cursoId: 'primaria-3',
        usuarioId: 'usuario-1',
      },
    });
  });

  it('no deja borrar una asignatura oficial', async () => {
    prismaFalso.asignatura.findUnique.mockResolvedValue({
      id: 'primaria-3-matematicas',
      usuarioId: null,
    });

    await expect(
      servicio.eliminarOptativaPropia('usuario-1', 'primaria-3-matematicas'),
    ).rejects.toThrow(ForbiddenException);
    expect(prismaFalso.asignatura.delete).not.toHaveBeenCalled();
  });

  it('borra una optativa propia', async () => {
    prismaFalso.asignatura.findUnique.mockResolvedValue({
      id: 'propia',
      usuarioId: 'usuario-1',
    });

    await servicio.eliminarOptativaPropia('usuario-1', 'propia');

    expect(prismaFalso.asignatura.delete).toHaveBeenCalledWith({
      where: { id: 'propia' },
    });
  });
});
