import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import webpush from 'web-push';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { cargaNotificacion, PushService } from './push.service.js';

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));

const ENTREGA = {
  id: 'aviso-1',
  tipo: 'ENTREGA' as const,
  datos: { titulo: 'Maqueta', fechaLimite: '2026-10-01T00:00:00.000Z', horasRestantes: 5 },
};
const REVISION = {
  id: 'aviso-2',
  tipo: 'REVISION_SOLICITADA' as const,
  datos: { titulo: 'Maqueta', nombre: 'Lucía' },
};

const SUSCRIPCION = { id: 's-1', endpoint: 'https://push.example.com/abc', p256dh: 'clave', auth: 'secreto' };

describe('PushService', () => {
  const prismaFalso = {
    suscripcionPush: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
  };

  async function crearServicio(configurado = true) {
    const valores: Record<string, string> = configurado
      ? { VAPID_PUBLIC_KEY: 'publica', VAPID_PRIVATE_KEY: 'privada', VAPID_SUBJECT: 'mailto:a@example.com' }
      : {};
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: ConfigService, useValue: { get: (clave: string) => valores[clave] } },
      ],
    }).compile();
    return modulo.get(PushService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    prismaFalso.suscripcionPush.findMany.mockResolvedValue([SUSCRIPCION]);
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);
  });

  describe('cargaNotificacion', () => {
    it('con un aviso usa su texto y lleva a Recordatorios', () => {
      expect(cargaNotificacion([ENTREGA])).toEqual({
        titulo: 'Entrega en 5 h: Maqueta',
        cuerpo: '«Maqueta» vence el 01/10/2026. Quedan unas 5 horas.',
        url: '/recordatorios',
        etiqueta: 'aviso-aviso-1',
        emergencia: false,
      });
    });

    it('una petición de revisión lleva a Familia; varios avisos se resumen', () => {
      expect(cargaNotificacion([REVISION]).url).toBe('/familia');

      const varios = cargaNotificacion([ENTREGA, REVISION]);
      expect(varios.titulo).toBe('Tienes 2 avisos nuevos');
      expect(varios.cuerpo).toBe('Entrega en 5 h: Maqueta\nLucía espera tu revisión');
      expect(varios.url).toBe('/recordatorios');
    });

    it('una emergencia se marca para quedarse en pantalla', () => {
      const emergencia = { id: 'e', tipo: 'EMERGENCIA' as const, datos: { titulo: 'Maqueta', diasSinTocar: 4 } };
      expect(cargaNotificacion([emergencia]).emergencia).toBe(true);
    });
  });

  it('sin claves VAPID no ofrece clave pública ni envía nada', async () => {
    const servicio = await crearServicio(false);

    expect(servicio.clavePublica()).toEqual({ clavePublica: null });
    await servicio.enviarAvisos('hija', [ENTREGA]);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('envía el aviso cifrado a cada dispositivo del usuario', async () => {
    const servicio = await crearServicio();

    await servicio.enviarAvisos('hija', [ENTREGA]);

    expect(prismaFalso.suscripcionPush.findMany).toHaveBeenCalledWith({ where: { usuarioId: 'hija' } });
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: SUSCRIPCION.endpoint, keys: { p256dh: 'clave', auth: 'secreto' } },
      JSON.stringify(cargaNotificacion([ENTREGA])),
      { TTL: 24 * 60 * 60 },
    );
  });

  it('borra la suscripción que el navegador ha anulado (410) y no lanza con otros errores', async () => {
    const servicio = await crearServicio();
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 });

    await servicio.enviarAvisos('hija', [ENTREGA]);
    expect(prismaFalso.suscripcionPush.delete).toHaveBeenCalledWith({ where: { id: 's-1' } });

    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 500 });
    await expect(servicio.enviarAvisos('hija', [ENTREGA])).resolves.toBeUndefined();
    expect(prismaFalso.suscripcionPush.delete).toHaveBeenCalledTimes(1);
  });

  it('el aviso de prueba lleva a Ajustes y dice a cuántos dispositivos se envió', async () => {
    const servicio = await crearServicio();

    await expect(servicio.enviarPrueba('hija')).resolves.toEqual({ dispositivos: 1 });
    const carga = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string);
    expect(carga).toMatchObject({ url: '/ajustes', etiqueta: 'prueba' });
  });

  it('suscribir pasa el dispositivo a la cuenta actual si ya estaba con otra', async () => {
    const servicio = await crearServicio();

    await servicio.suscribir('hija', { endpoint: SUSCRIPCION.endpoint, keys: { p256dh: 'clave', auth: 'secreto' } });

    expect(prismaFalso.suscripcionPush.upsert).toHaveBeenCalledWith({
      where: { endpoint: SUSCRIPCION.endpoint },
      create: { endpoint: SUSCRIPCION.endpoint, p256dh: 'clave', auth: 'secreto', usuarioId: 'hija' },
      update: { p256dh: 'clave', auth: 'secreto', usuarioId: 'hija' },
    });
  });

  it('desuscribir solo borra la suscripción si es del propio usuario', async () => {
    const servicio = await crearServicio();

    await servicio.desuscribir('hija', SUSCRIPCION.endpoint);

    expect(prismaFalso.suscripcionPush.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: SUSCRIPCION.endpoint, usuarioId: 'hija' },
    });
  });
});
