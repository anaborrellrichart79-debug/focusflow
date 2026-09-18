import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Usuario } from '../generated/prisma/client.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { AutenticacionService } from './autenticacion.service.js';

function crearUsuarioFalso(datos: Partial<Usuario> = {}): Usuario {
  return {
    id: 'usuario-1',
    correo: 'ana@example.com',
    contrasena: 'hash-guardado',
    nombre: 'Ana',
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00.000Z'),
    ...datos,
  } as Usuario;
}

describe('AutenticacionService', () => {
  let servicio: AutenticacionService;
  const prismaFalso = {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  const jwtServiceFalso = {
    sign: vi.fn(() => 'token-firmado'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: JwtService, useValue: jwtServiceFalso },
      ],
    }).compile();

    servicio = modulo.get(AutenticacionService);
  });

  describe('registrar', () => {
    it('rechaza el registro si ya existe un usuario con ese correo', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(crearUsuarioFalso());

      await expect(
        servicio.registrar({ correo: 'ana@example.com', contrasena: 'Abcdefg1' }),
      ).rejects.toThrow(ConflictException);

      expect(prismaFalso.usuario.create).not.toHaveBeenCalled();
    });

    it('guarda la contraseña hasheada (nunca en texto plano) y devuelve el token', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);
      prismaFalso.usuario.create.mockImplementation(({ data }: { data: Partial<Usuario> }) =>
        crearUsuarioFalso(data),
      );

      const resultado = await servicio.registrar({
        correo: 'nueva@example.com',
        contrasena: 'Abcdefg1',
        nombre: 'Nueva',
      });

      const datosGuardados = prismaFalso.usuario.create.mock.calls[0][0].data;
      expect(datosGuardados.contrasena).not.toBe('Abcdefg1');
      expect(await bcrypt.compare('Abcdefg1', datosGuardados.contrasena)).toBe(true);

      expect(resultado.tokenAcceso).toBe('token-firmado');
      expect(resultado.usuario).toEqual({
        id: 'usuario-1',
        correo: 'nueva@example.com',
        nombre: 'Nueva',
      });
    });
  });

  describe('iniciarSesion', () => {
    it('rechaza el acceso si el correo no existe, sin distinguir el motivo', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);

      await expect(
        servicio.iniciarSesion({ correo: 'nadie@example.com', contrasena: 'Abcdefg1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza el acceso si la contraseña no coincide', async () => {
      const hashReal = await bcrypt.hash('ContrasenaCorrecta1', 10);
      prismaFalso.usuario.findUnique.mockResolvedValue(
        crearUsuarioFalso({ contrasena: hashReal }),
      );

      await expect(
        servicio.iniciarSesion({ correo: 'ana@example.com', contrasena: 'OtraContrasena1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devuelve el token cuando la contraseña coincide', async () => {
      const hashReal = await bcrypt.hash('ContrasenaCorrecta1', 10);
      prismaFalso.usuario.findUnique.mockResolvedValue(
        crearUsuarioFalso({ contrasena: hashReal }),
      );

      const resultado = await servicio.iniciarSesion({
        correo: 'ana@example.com',
        contrasena: 'ContrasenaCorrecta1',
      });

      expect(resultado.tokenAcceso).toBe('token-firmado');
      expect(resultado.usuario.correo).toBe('ana@example.com');
    });
  });

  describe('obtenerUsuarioPorId', () => {
    it('lanza NotFoundException si no existe', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);

      await expect(servicio.obtenerUsuarioPorId('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('nunca devuelve el hash de la contraseña', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(crearUsuarioFalso());

      const resultado = await servicio.obtenerUsuarioPorId('usuario-1');

      expect(resultado).toEqual({ id: 'usuario-1', correo: 'ana@example.com', nombre: 'Ana' });
      expect(resultado).not.toHaveProperty('contrasena');
    });
  });
});
