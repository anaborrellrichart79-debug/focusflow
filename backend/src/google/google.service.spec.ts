import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { GoogleService } from './google.service.js';

const clienteOAuthFalso = {
  generateAuthUrl: vi.fn(() => 'https://accounts.google.com/o/oauth2/auth?fake=1'),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  on: vi.fn(),
};

const calendarFalso = {
  events: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
};

vi.mock('googleapis', () => ({
  google: {
    auth: {
      // Implementación con `function` (no arrow) porque `new google.auth.OAuth2(...)`
      // en el servicio real exige que sea invocable como constructor.
      OAuth2: vi.fn(function OAuth2Falso() {
        return clienteOAuthFalso;
      }),
    },
    calendar: vi.fn(() => calendarFalso),
  },
}));

describe('GoogleService', () => {
  let servicio: GoogleService;

  const prismaFalso = {
    usuario: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    tarea: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sesionPomodoro: {
      findMany: vi.fn(),
    },
    eventoCalendarioGoogle: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const jwtFalso = {
    sign: vi.fn(() => 'token-estado-falso'),
    verify: vi.fn(),
  };

  const configFalso = {
    get: vi.fn((clave: string) => {
      const valores: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'id-falso',
        GOOGLE_CLIENT_SECRET: 'secreto-falso',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/google/callback',
      };
      return valores[clave];
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    configFalso.get.mockImplementation((clave: string) => {
      const valores: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'id-falso',
        GOOGLE_CLIENT_SECRET: 'secreto-falso',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/google/callback',
      };
      return valores[clave];
    });

    prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({
      googleAccessToken: 'access-falso',
      googleRefreshToken: 'refresh-falso',
      googleTokenExpiraEn: new Date('2026-09-22T12:00:00.000Z'),
      googleUltimaSincronizacion: null,
    });
    prismaFalso.tarea.findMany.mockResolvedValue([]);
    prismaFalso.sesionPomodoro.findMany.mockResolvedValue([]);
    prismaFalso.eventoCalendarioGoogle.findMany.mockResolvedValue([]);
    calendarFalso.events.list.mockResolvedValue({ data: { items: [] } });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: JwtService, useValue: jwtFalso },
        { provide: ConfigService, useValue: configFalso },
      ],
    }).compile();

    servicio = modulo.get(GoogleService);
  });

  describe('generarUrlAutorizacion', () => {
    it('rechaza generar la URL si el servidor no tiene configurado GOOGLE_CLIENT_ID', () => {
      configFalso.get.mockReturnValue(undefined);

      expect(() => servicio.generarUrlAutorizacion('usuario-1')).toThrow(BadRequestException);
    });

    it('firma el usuarioId como parámetro state y devuelve la URL de Google', () => {
      const url = servicio.generarUrlAutorizacion('usuario-1');

      expect(jwtFalso.sign).toHaveBeenCalledWith({ sub: 'usuario-1' }, { expiresIn: '10m' });
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?fake=1');
    });
  });

  describe('manejarCallback', () => {
    it('rechaza un state caducado o manipulado sin llamar a Google', async () => {
      jwtFalso.verify.mockImplementation(() => {
        throw new Error('token inválido');
      });

      await expect(servicio.manejarCallback('codigo', 'state-malo')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(clienteOAuthFalso.getToken).not.toHaveBeenCalled();
    });

    it('intercambia el código y guarda los tokens del usuario identificado en el state', async () => {
      jwtFalso.verify.mockReturnValue({ sub: 'usuario-1' });
      clienteOAuthFalso.getToken.mockResolvedValue({
        tokens: {
          access_token: 'access-nuevo',
          refresh_token: 'refresh-nuevo',
          expiry_date: 1_800_000_000_000,
        },
      });

      await servicio.manejarCallback('codigo', 'state-bueno');

      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'usuario-1' },
        data: {
          googleAccessToken: 'access-nuevo',
          googleRefreshToken: 'refresh-nuevo',
          googleTokenExpiraEn: new Date(1_800_000_000_000),
        },
      });
    });
  });

  describe('obtenerEstado', () => {
    it('informa conectado cuando hay un refresh token guardado', async () => {
      const estado = await servicio.obtenerEstado('usuario-1');

      expect(estado.conectado).toBe(true);
    });

    it('informa no conectado cuando no hay refresh token', async () => {
      prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({
        googleRefreshToken: null,
        googleUltimaSincronizacion: null,
      });

      const estado = await servicio.obtenerEstado('usuario-1');

      expect(estado.conectado).toBe(false);
    });
  });

  describe('desconectar', () => {
    it('borra los tokens del usuario y todos sus eventos sincronizados', async () => {
      await servicio.desconectar('usuario-1');

      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'usuario-1' },
        data: {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiraEn: null,
          googleUltimaSincronizacion: null,
        },
      });
      expect(prismaFalso.eventoCalendarioGoogle.deleteMany).toHaveBeenCalledWith({
        where: { usuarioId: 'usuario-1' },
      });
    });
  });

  describe('sincronizar', () => {
    it('rechaza sincronizar una cuenta sin conectar', async () => {
      prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiraEn: null,
      });

      await expect(servicio.sincronizar('usuario-1')).rejects.toThrow(BadRequestException);
    });

    it('crea un evento nuevo en Google para una tarea con fecha límite sin evento aún', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-1',
          titulo: 'Entregar informe',
          descripcion: null,
          estado: 'POR_HACER',
          fechaLimite: new Date('2026-09-25T12:00:00.000Z'),
          eventoGoogle: null,
        },
      ]);
      calendarFalso.events.insert.mockResolvedValue({ data: { id: 'evento-google-1' } });

      const resumen = await servicio.sincronizar('usuario-1');

      expect(calendarFalso.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'primary',
          requestBody: expect.objectContaining({ summary: 'Entregar informe' }),
        }),
      );
      expect(prismaFalso.eventoCalendarioGoogle.create).toHaveBeenCalledWith({
        data: { usuarioId: 'usuario-1', googleEventId: 'evento-google-1', tareaId: 'tarea-1' },
      });
      expect(resumen.creados).toBe(1);
    });

    it('actualiza el evento existente cuando la tarea ya tenía evento gemelo', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-1',
          titulo: 'Entregar informe (revisado)',
          descripcion: null,
          estado: 'EN_PROCESO',
          fechaLimite: new Date('2026-09-25T12:00:00.000Z'),
          eventoGoogle: { id: 'rel-1', googleEventId: 'evento-google-1' },
        },
      ]);

      const resumen = await servicio.sincronizar('usuario-1');

      expect(calendarFalso.events.update).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'evento-google-1' }),
      );
      expect(resumen.actualizados).toBe(1);
    });

    it('borra el evento de Google cuando la tarea asociada se completó', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-1',
          titulo: 'Entregar informe',
          descripcion: null,
          estado: 'HECHA',
          fechaLimite: new Date('2026-09-25T12:00:00.000Z'),
          eventoGoogle: { id: 'rel-1', googleEventId: 'evento-google-1' },
        },
      ]);
      calendarFalso.events.delete.mockResolvedValue({});

      const resumen = await servicio.sincronizar('usuario-1');

      expect(calendarFalso.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'evento-google-1',
      });
      expect(prismaFalso.eventoCalendarioGoogle.delete).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
      expect(resumen.eliminados).toBe(1);
    });

    it('empuja las sesiones de Pomodoro de trabajo que aún no tienen evento', async () => {
      prismaFalso.sesionPomodoro.findMany.mockResolvedValue([
        {
          id: 'sesion-1',
          completadaEn: new Date('2026-09-21T18:00:00.000Z'),
          duracionSegundos: 1500,
          tarea: { titulo: 'Escribir tests' },
        },
      ]);
      calendarFalso.events.insert.mockResolvedValue({ data: { id: 'evento-google-2' } });

      const resumen = await servicio.sincronizar('usuario-1');

      expect(prismaFalso.eventoCalendarioGoogle.create).toHaveBeenCalledWith({
        data: { usuarioId: 'usuario-1', googleEventId: 'evento-google-2', sesionPomodoroId: 'sesion-1' },
      });
      expect(resumen.creados).toBe(1);
    });

    it('importa como tarea nueva un evento del calendario que no conocía', async () => {
      calendarFalso.events.list.mockResolvedValue({
        data: {
          items: [
            {
              id: 'evento-externo-1',
              summary: 'Cita del dentista',
              status: 'confirmed',
              start: { date: '2026-09-26' },
            },
          ],
        },
      });
      prismaFalso.tarea.create.mockResolvedValue({ id: 'tarea-importada-1' });

      const resumen = await servicio.sincronizar('usuario-1');

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
        data: {
          titulo: 'Cita del dentista',
          fechaLimite: new Date('2026-09-26'),
          usuarioId: 'usuario-1',
        },
      });
      expect(prismaFalso.eventoCalendarioGoogle.create).toHaveBeenCalledWith({
        data: { usuarioId: 'usuario-1', googleEventId: 'evento-externo-1', tareaId: 'tarea-importada-1' },
      });
      expect(resumen.importados).toBe(1);
    });

    it('crea un evento con hora (no de todo el día) cuando la tarea tiene hora de inicio', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-1',
          titulo: 'Reunión de equipo',
          descripcion: null,
          estado: 'POR_HACER',
          fechaLimite: new Date('2026-09-25T09:00:00.000Z'),
          duracionMinutos: 45,
          eventoGoogle: null,
        },
      ]);
      calendarFalso.events.insert.mockResolvedValue({ data: { id: 'evento-google-1' } });

      await servicio.sincronizar('usuario-1');

      expect(calendarFalso.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            start: { dateTime: '2026-09-25T09:00:00.000Z' },
            end: { dateTime: '2026-09-25T09:45:00.000Z' },
          }),
        }),
      );
    });

    it('usa 30 minutos de duración por defecto si la tarea con hora no tiene duracionMinutos', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-1',
          titulo: 'Llamada rápida',
          descripcion: null,
          estado: 'POR_HACER',
          fechaLimite: new Date('2026-09-25T09:00:00.000Z'),
          duracionMinutos: null,
          eventoGoogle: null,
        },
      ]);
      calendarFalso.events.insert.mockResolvedValue({ data: { id: 'evento-google-1' } });

      await servicio.sincronizar('usuario-1');

      expect(calendarFalso.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            end: { dateTime: '2026-09-25T09:30:00.000Z' },
          }),
        }),
      );
    });

    it('no aborta la sincronización si un evento concreto falla al hablar con Google', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        {
          id: 'tarea-conflictiva',
          titulo: 'Instancia de evento recurrente',
          descripcion: null,
          estado: 'EN_PROCESO',
          fechaLimite: new Date('2026-09-25T00:00:00.000Z'),
          duracionMinutos: null,
          eventoGoogle: { id: 'rel-1', googleEventId: 'evento-recurrente-1' },
        },
        {
          id: 'tarea-normal',
          titulo: 'Tarea que sí puede sincronizarse',
          descripcion: null,
          estado: 'POR_HACER',
          fechaLimite: new Date('2026-09-26T00:00:00.000Z'),
          duracionMinutos: null,
          eventoGoogle: null,
        },
      ]);
      calendarFalso.events.update.mockRejectedValueOnce(new Error('Bad Request'));
      calendarFalso.events.insert.mockResolvedValue({ data: { id: 'evento-google-2' } });

      const resumen = await servicio.sincronizar('usuario-1');

      expect(resumen.errores).toBe(1);
      expect(resumen.creados).toBe(1);
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { googleUltimaSincronizacion: expect.any(Date) } }),
      );
    });

    it('captura la duración real al importar un evento con hora', async () => {
      calendarFalso.events.list.mockResolvedValue({
        data: {
          items: [
            {
              id: 'evento-externo-1',
              summary: 'Revisión médica',
              status: 'confirmed',
              start: { dateTime: '2026-09-26T10:00:00.000Z' },
              end: { dateTime: '2026-09-26T10:45:00.000Z' },
            },
          ],
        },
      });
      prismaFalso.tarea.create.mockResolvedValue({ id: 'tarea-importada-1' });

      await servicio.sincronizar('usuario-1');

      expect(prismaFalso.tarea.create).toHaveBeenCalledWith({
        data: {
          titulo: 'Revisión médica',
          fechaLimite: new Date('2026-09-26T10:00:00.000Z'),
          duracionMinutos: 45,
          usuarioId: 'usuario-1',
        },
      });
    });

    it('no reimporta ni toca un evento ya conocido que sigue igual', async () => {
      const tareaExistente = {
        id: 'tarea-1',
        titulo: 'Entregar informe',
        descripcion: null,
        estado: 'POR_HACER',
        fechaLimite: new Date('2026-09-25T00:00:00.000Z'),
        eventoGoogle: { id: 'rel-1', googleEventId: 'evento-google-1' },
      };
      prismaFalso.tarea.findMany.mockResolvedValue([tareaExistente]);
      prismaFalso.eventoCalendarioGoogle.findMany.mockResolvedValue([
        { googleEventId: 'evento-google-1', tareaId: 'tarea-1' },
      ]);
      calendarFalso.events.list.mockResolvedValue({
        data: {
          items: [
            {
              id: 'evento-google-1',
              summary: 'Entregar informe',
              status: 'confirmed',
              start: { date: '2026-09-25' },
            },
          ],
        },
      });

      const resumen = await servicio.sincronizar('usuario-1');

      expect(prismaFalso.tarea.update).not.toHaveBeenCalled();
      expect(prismaFalso.tarea.create).not.toHaveBeenCalled();
      expect(resumen.importados).toBe(0);
    });
  });
});
