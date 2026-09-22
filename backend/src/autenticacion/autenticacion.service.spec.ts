import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CorreoService } from '../correo/correo.service.js';
import type { Usuario } from '../generated/prisma/client.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { AutenticacionService } from './autenticacion.service.js';

const FECHA_NACIMIENTO_ADULTA = '1990-01-01T00:00:00.000Z';
const FECHA_NACIMIENTO_MENOR = '2015-01-01T00:00:00.000Z';

function crearUsuarioFalso(datos: Partial<Usuario> = {}): Usuario {
  return {
    id: 'usuario-1',
    correo: 'ana@example.com',
    contrasena: 'hash-guardado',
    nombre: 'Ana',
    fechaNacimiento: new Date(FECHA_NACIMIENTO_ADULTA),
    correoTutor: null,
    consentimientoConfirmado: true,
    consentimientoReenviadoEn: null,
    modoEscolarActivo: false,
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
      update: vi.fn(),
    },
  };
  const jwtServiceFalso = {
    sign: vi.fn(() => 'token-firmado'),
    verify: vi.fn(),
  };
  const configFalso = {
    get: vi.fn(() => 'http://localhost:5173'),
  };
  const correoServiceFalso = {
    enviarCorreoConfirmacionConsentimiento: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    configFalso.get.mockReturnValue('http://localhost:5173');
    // vi.clearAllMocks() no borra implementaciones puestas con mockRejectedValue/
    // mockResolvedValue en un test anterior, solo el historial de llamadas: sin
    // este reset explícito, un test que hace fallar este mock "contaminaría" el
    // comportamiento por defecto de los tests siguientes.
    correoServiceFalso.enviarCorreoConfirmacionConsentimiento.mockResolvedValue(undefined);

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: JwtService, useValue: jwtServiceFalso },
        { provide: ConfigService, useValue: configFalso },
        { provide: CorreoService, useValue: correoServiceFalso },
      ],
    }).compile();

    servicio = modulo.get(AutenticacionService);
  });

  describe('registrar', () => {
    it('rechaza el registro si ya existe un usuario con ese correo', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(crearUsuarioFalso());

      await expect(
        servicio.registrar({
          correo: 'ana@example.com',
          contrasena: 'Abcdefg1',
          fechaNacimiento: FECHA_NACIMIENTO_ADULTA,
        }),
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
        fechaNacimiento: FECHA_NACIMIENTO_ADULTA,
      });

      const datosGuardados = prismaFalso.usuario.create.mock.calls[0][0].data;
      expect(datosGuardados.contrasena).not.toBe('Abcdefg1');
      expect(await bcrypt.compare('Abcdefg1', datosGuardados.contrasena)).toBe(true);

      expect(resultado.tokenAcceso).toBe('token-firmado');
      expect(resultado.usuario).toEqual({
        id: 'usuario-1',
        correo: 'nueva@example.com',
        nombre: 'Nueva',
        consentimientoConfirmado: true,
        modoEscolarActivo: false,
      });
    });

    it('a un adulto le deja consentimientoConfirmado en true y no envía ningún correo', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);
      prismaFalso.usuario.create.mockImplementation(({ data }: { data: Partial<Usuario> }) =>
        crearUsuarioFalso(data),
      );

      await servicio.registrar({
        correo: 'adulto@example.com',
        contrasena: 'Abcdefg1',
        fechaNacimiento: FECHA_NACIMIENTO_ADULTA,
      });

      const datosGuardados = prismaFalso.usuario.create.mock.calls[0][0].data;
      expect(datosGuardados.consentimientoConfirmado).toBe(true);
      expect(correoServiceFalso.enviarCorreoConfirmacionConsentimiento).not.toHaveBeenCalled();
    });

    it('a un menor le deja consentimientoConfirmado en false y envía el correo al tutor', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);
      prismaFalso.usuario.create.mockImplementation(({ data }: { data: Partial<Usuario> }) =>
        crearUsuarioFalso({ ...data, id: 'usuario-menor' }),
      );

      await servicio.registrar({
        correo: 'menor@example.com',
        contrasena: 'Abcdefg1',
        fechaNacimiento: FECHA_NACIMIENTO_MENOR,
        correoTutor: 'tutor@example.com',
      });

      const datosGuardados = prismaFalso.usuario.create.mock.calls[0][0].data;
      expect(datosGuardados.consentimientoConfirmado).toBe(false);
      expect(datosGuardados.correoTutor).toBe('tutor@example.com');
      expect(correoServiceFalso.enviarCorreoConfirmacionConsentimiento).toHaveBeenCalledWith(
        'tutor@example.com',
        expect.stringContaining('token-firmado'),
      );
    });

    it('no rompe el registro de un menor si el envío de correo no está configurado', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(null);
      prismaFalso.usuario.create.mockImplementation(({ data }: { data: Partial<Usuario> }) =>
        crearUsuarioFalso({ ...data, id: 'usuario-menor' }),
      );
      correoServiceFalso.enviarCorreoConfirmacionConsentimiento.mockRejectedValue(
        new BadRequestException('El envío de correo no está configurado en el servidor'),
      );

      await expect(
        servicio.registrar({
          correo: 'menor2@example.com',
          contrasena: 'Abcdefg1',
          fechaNacimiento: FECHA_NACIMIENTO_MENOR,
          correoTutor: 'tutor2@example.com',
        }),
      ).resolves.toBeDefined();
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

    it('nunca devuelve el hash de la contraseña ni datos del tutor', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(crearUsuarioFalso());

      const resultado = await servicio.obtenerUsuarioPorId('usuario-1');

      expect(resultado).toEqual({
        id: 'usuario-1',
        correo: 'ana@example.com',
        nombre: 'Ana',
        consentimientoConfirmado: true,
        modoEscolarActivo: false,
      });
      expect(resultado).not.toHaveProperty('contrasena');
      expect(resultado).not.toHaveProperty('correoTutor');
    });
  });

  describe('confirmarConsentimiento', () => {
    it('marca la cuenta como confirmada con un token válido', async () => {
      jwtServiceFalso.verify.mockReturnValue({
        sub: 'usuario-menor',
        tipo: 'confirmacion-consentimiento',
      });

      await servicio.confirmarConsentimiento('token-valido');

      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'usuario-menor' },
        data: { consentimientoConfirmado: true },
      });
    });

    it('rechaza un token caducado o manipulado', async () => {
      jwtServiceFalso.verify.mockImplementation(() => {
        throw new Error('token inválido');
      });

      await expect(servicio.confirmarConsentimiento('token-malo')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    });

    it('rechaza un token de otro propósito distinto al de consentimiento', async () => {
      jwtServiceFalso.verify.mockReturnValue({ sub: 'usuario-1', tipo: 'otra-cosa' });

      await expect(servicio.confirmarConsentimiento('token-otro-tipo')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('reenviarConfirmacion', () => {
    it('rechaza si la cuenta no tiene correo de tutor registrado', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(crearUsuarioFalso({ correoTutor: null }));

      await expect(servicio.reenviarConfirmacion('usuario-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('reenvía el correo y actualiza consentimientoReenviadoEn', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(
        crearUsuarioFalso({ correoTutor: 'tutor@example.com', consentimientoReenviadoEn: null }),
      );

      await servicio.reenviarConfirmacion('usuario-1');

      expect(correoServiceFalso.enviarCorreoConfirmacionConsentimiento).toHaveBeenCalledWith(
        'tutor@example.com',
        expect.any(String),
      );
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'usuario-1' },
        data: { consentimientoReenviadoEn: expect.any(Date) },
      });
    });

    it('rechaza reenviar antes de que pasen 5 minutos desde el último reenvío', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(
        crearUsuarioFalso({
          correoTutor: 'tutor@example.com',
          consentimientoReenviadoEn: new Date(Date.now() - 60_000),
        }),
      );

      await expect(servicio.reenviarConfirmacion('usuario-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(correoServiceFalso.enviarCorreoConfirmacionConsentimiento).not.toHaveBeenCalled();
    });

    it('deja pasar el error de "correo no configurado" tal cual al que llama', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(
        crearUsuarioFalso({ correoTutor: 'tutor@example.com', consentimientoReenviadoEn: null }),
      );
      correoServiceFalso.enviarCorreoConfirmacionConsentimiento.mockRejectedValue(
        new BadRequestException('El envío de correo no está configurado en el servidor'),
      );

      await expect(servicio.reenviarConfirmacion('usuario-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('actualizarPreferencias', () => {
    it('actualiza modoEscolarActivo y devuelve los datos públicos del usuario', async () => {
      prismaFalso.usuario.update.mockResolvedValue(crearUsuarioFalso({ modoEscolarActivo: true }));

      const resultado = await servicio.actualizarPreferencias('usuario-1', true);

      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'usuario-1' },
        data: { modoEscolarActivo: true },
      });
      expect(resultado.modoEscolarActivo).toBe(true);
    });
  });
});
