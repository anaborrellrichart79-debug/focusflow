import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { PlanesService } from './planes.service.js';

function usuario(plan: 'GRATUITO' | 'PAGO', planesResponsables: ('GRATUITO' | 'PAGO')[] = []) {
  return {
    plan,
    vinculosComoSupervisado: planesResponsables.map((p) => ({ responsable: { plan: p } })),
  };
}

describe('PlanesService', () => {
  let servicio: PlanesService;
  const prismaFalso = {
    usuario: { findUnique: vi.fn() },
    usoIa: { count: vi.fn(), create: vi.fn() },
  };
  const configFalso = { get: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    configFalso.get.mockReturnValue(undefined);
    prismaFalso.usoIa.count.mockResolvedValue(0);
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PlanesService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: ConfigService, useValue: configFalso },
      ],
    }).compile();
    servicio = modulo.get(PlanesService);
  });

  describe('origen de la IA', () => {
    it('gratuito sin familia de pago: sin IA', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('GRATUITO', ['GRATUITO']));
      expect(await servicio.origenIa('laura')).toBeNull();
      expect(await servicio.tieneIa('laura')).toBe(false);
    });

    it('plan de pago propio', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('PAGO'));
      expect(await servicio.origenIa('ana')).toBe('PROPIO');
    });

    it('menor vinculado a un adulto con plan de pago (plan familiar)', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('GRATUITO', ['GRATUITO', 'PAGO']));
      expect(await servicio.origenIa('sofia')).toBe('FAMILIA');
    });

    it('cuenta que no existe: sin IA', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);
      expect(await servicio.tieneIa('nadie')).toBe(false);
    });
  });

  describe('comprobarUsoIa', () => {
    it('sin plan de pago: 403', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('GRATUITO'));
      await expect(servicio.comprobarUsoIa('laura')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('con el límite del mes gastado: 429', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('PAGO'));
      prismaFalso.usoIa.count.mockResolvedValue(100);

      const error = await servicio.comprobarUsoIa('ana').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('el límite se puede cambiar en .env y se cuenta desde el día 1 del mes', async () => {
      configFalso.get.mockImplementation((clave: string) => (clave === 'IA_LIMITE_MENSUAL' ? '5' : undefined));
      prismaFalso.usuario.findUnique.mockResolvedValue(usuario('PAGO'));
      prismaFalso.usoIa.count.mockResolvedValue(4);

      await expect(servicio.comprobarUsoIa('ana')).resolves.toBeUndefined();
      const filtro = prismaFalso.usoIa.count.mock.calls[0][0].where.creadoEn.gte as Date;
      expect(filtro.getDate()).toBe(1);
    });
  });

  it('estadoIa resume plan, usos y límite para la interfaz', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValue(usuario('GRATUITO', ['PAGO']));
    prismaFalso.usoIa.count.mockResolvedValue(7);

    expect(await servicio.estadoIa('sofia')).toEqual({ incluida: true, origen: 'FAMILIA', usados: 7, limite: 100 });
  });

  it('registrarUsoIa guarda el uso con su tipo', async () => {
    await servicio.registrarUsoIa('ana', 'PLAN_ESTUDIO');
    expect(prismaFalso.usoIa.create).toHaveBeenCalledWith({ data: { usuarioId: 'ana', tipo: 'PLAN_ESTUDIO' } });
  });
});
