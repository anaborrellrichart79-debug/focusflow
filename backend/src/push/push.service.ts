import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import type { TipoAviso } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { textoAviso } from '../recordatorios/textos-aviso.js';
import type { SuscribirPushDto } from './dto/push.dto.js';

// Cuánto guarda el servicio de push un aviso para un dispositivo apagado o
// sin conexión antes de descartarlo.
const SEGUNDOS_VIDA_AVISO = 24 * 60 * 60;

interface AvisoParaPush {
  id: string;
  tipo: TipoAviso;
  datos: unknown;
}

export interface CargaNotificacion {
  titulo: string;
  cuerpo: string;
  // Página que abre la notificación al pulsarla.
  url: string;
  // Una notificación con la misma etiqueta sustituye a la anterior.
  etiqueta: string;
  // Una alarma de emergencia se queda en pantalla hasta que se atiende.
  emergencia: boolean;
}

// Lo que ve el usuario en la notificación. Mismo criterio que VigilanteAvisos
// en el frontend: una petición de revisión se atiende en Familia; lo demás, en
// Recordatorios. Los textos van en castellano (el backend no conoce el idioma
// de la interfaz, igual que en el correo).
export function cargaNotificacion(avisos: AvisoParaPush[]): CargaNotificacion {
  const textos = avisos.map((aviso) => textoAviso(aviso.tipo, aviso.datos));
  const soloRevisiones = avisos.every((aviso) => aviso.tipo === 'REVISION_SOLICITADA');
  return {
    titulo: avisos.length === 1 ? textos[0].titulo : `Tienes ${avisos.length} avisos nuevos`,
    cuerpo: avisos.length === 1 ? textos[0].cuerpo : textos.map((texto) => texto.titulo).join('\n'),
    url: soloRevisiones ? '/familia' : '/recordatorios',
    etiqueta: `aviso-${avisos[0].id}`,
    emergencia: avisos.some((aviso) => aviso.tipo === 'EMERGENCIA'),
  };
}

// Web Push: los avisos llegan al móvil o al ordenador aunque FocusFlow esté
// cerrado. Cada navegador que activa los avisos en Ajustes guarda aquí su
// suscripción; al crearse un aviso se envía a todos los dispositivos del
// usuario. Sin claves VAPID en el .env no hace nada (la app sigue avisando
// solo mientras está abierta).
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly clavePublicaVapid: string | null;

  constructor(
    private readonly prisma: ServicioPrisma,
    config: ConfigService,
  ) {
    const publica = config.get<string>('VAPID_PUBLIC_KEY');
    const privada = config.get<string>('VAPID_PRIVATE_KEY');
    const sujeto = config.get<string>('VAPID_SUBJECT');
    this.clavePublicaVapid = publica && privada && sujeto ? publica : null;
    if (this.clavePublicaVapid) webpush.setVapidDetails(sujeto!, publica!, privada!);
  }

  // null = el servidor no tiene Web Push configurado.
  clavePublica() {
    return { clavePublica: this.clavePublicaVapid };
  }

  // Si el dispositivo ya estaba suscrito con otra cuenta (se cambió de
  // usuario en el mismo navegador), pasa a la cuenta actual.
  async suscribir(usuarioId: string, datos: SuscribirPushDto) {
    await this.prisma.suscripcionPush.upsert({
      where: { endpoint: datos.endpoint },
      create: {
        endpoint: datos.endpoint,
        p256dh: datos.keys.p256dh,
        auth: datos.keys.auth,
        usuarioId,
      },
      update: { p256dh: datos.keys.p256dh, auth: datos.keys.auth, usuarioId },
    });
  }

  async desuscribir(usuarioId: string, endpoint: string) {
    await this.prisma.suscripcionPush.deleteMany({ where: { endpoint, usuarioId } });
  }

  // Nunca lanza: un fallo de push no debe impedir que el aviso se cree.
  async enviarAvisos(usuarioId: string, avisos: AvisoParaPush[]) {
    if (avisos.length === 0) return;
    await this.enviar(usuarioId, cargaNotificacion(avisos));
  }

  // Botón "Enviar aviso de prueba" de Ajustes. Devuelve a cuántos
  // dispositivos se ha intentado enviar.
  async enviarPrueba(usuarioId: string) {
    return this.enviar(usuarioId, {
      titulo: 'FocusFlow',
      cuerpo: 'Los avisos funcionan en este dispositivo.',
      url: '/ajustes',
      etiqueta: 'prueba',
      emergencia: false,
    });
  }

  private async enviar(usuarioId: string, cargaNotificacion: CargaNotificacion) {
    if (!this.clavePublicaVapid) return { dispositivos: 0 };
    try {
      const suscripciones = await this.prisma.suscripcionPush.findMany({ where: { usuarioId } });
      if (suscripciones.length === 0) return { dispositivos: 0 };
      const carga = JSON.stringify(cargaNotificacion);

      await Promise.all(
        suscripciones.map(async (suscripcion) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: suscripcion.endpoint,
                keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
              },
              carga,
              { TTL: SEGUNDOS_VIDA_AVISO },
            );
          } catch (error) {
            const estado = (error as { statusCode?: number }).statusCode;
            // 404/410: el navegador anuló la suscripción (se desinstaló la
            // app, se quitó el permiso...). No volverá a servir.
            if (estado === 404 || estado === 410) {
              await this.prisma.suscripcionPush.delete({ where: { id: suscripcion.id } });
            } else {
              this.logger.warn(`No se pudo enviar el aviso push (${estado ?? 'sin respuesta'})`);
            }
          }
        }),
      );
      return { dispositivos: suscripciones.length };
    } catch (error) {
      this.logger.error('Error enviando avisos push', error as Error);
      return { dispositivos: 0 };
    }
  }
}
