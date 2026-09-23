import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import { ServicioPrisma } from '../prisma/prisma.service.js';

const AMBITO_CALENDARIO = 'https://www.googleapis.com/auth/calendar.events';
// Ventana de importación (Google Calendar -> FocusFlow): solo eventos de los
// próximos 30 días. Nunca se recorre el calendario entero, para no volcar de
// golpe años de eventos ajenos a FocusFlow como si fuesen tareas nuevas.
const DIAS_VENTANA_IMPORTACION = 30;
// Al sincronizar por primera vez tras mucho historial de Pomodoro sin
// empujar, limita cuántas sesiones se crean como eventos en una sola pasada.
const LIMITE_SESIONES_POR_SINCRONIZACION = 50;

export interface ResumenSincronizacion {
  creados: number;
  actualizados: number;
  eliminados: number;
  importados: number;
  // Eventos individuales que fallaron al hablar con la API de Google (p. ej.
  // una instancia de un evento recurrente que Google rechaza reescribir) y
  // que se omitieron para no abortar el resto de la sincronización.
  errores: number;
}

const DURACION_MINUTOS_POR_DEFECTO = 30;

function mismoDia(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

// Una tarea "tiene hora de inicio" cuando su fechaLimite no cae exactamente a
// medianoche UTC; así se distingue de una fecha límite sin hora (la que pone
// un <input type="date">, que Date interpreta como medianoche UTC) sin
// necesitar un campo booleano aparte.
function tieneHoraInicio(fecha: Date): boolean {
  return (
    fecha.getUTCHours() !== 0 ||
    fecha.getUTCMinutes() !== 0 ||
    fecha.getUTCSeconds() !== 0 ||
    fecha.getUTCMilliseconds() !== 0
  );
}

@Injectable()
export class GoogleService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private crearClienteOAuth() {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  generarUrlAutorizacion(usuarioId: string): string {
    if (!this.config.get('GOOGLE_CLIENT_ID')) {
      throw new BadRequestException(
        'La sincronización con Google Calendar no está configurada en el servidor',
      );
    }

    const cliente = this.crearClienteOAuth();
    const estado = this.jwtService.sign({ sub: usuarioId }, { expiresIn: '10m' });

    return cliente.generateAuthUrl({
      access_type: 'offline',
      // Fuerza que Google entregue de nuevo un refresh_token incluso si el
      // usuario ya había autorizado la app antes (si no, en reconexiones
      // Google solo manda el access_token, y sin refresh_token no se puede
      // renovar la sesión sola).
      prompt: 'consent',
      scope: [AMBITO_CALENDARIO],
      state: estado,
    });
  }

  async manejarCallback(code: string, estado: string) {
    let usuarioId: string;
    try {
      const carga = this.jwtService.verify<{ sub: string }>(estado);
      usuarioId = carga.sub;
    } catch {
      throw new UnauthorizedException('Enlace de conexión con Google caducado o inválido');
    }

    const cliente = this.crearClienteOAuth();
    const { tokens } = await cliente.getToken(code);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleTokenExpiraEn: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    return { usuarioId };
  }

  async obtenerEstado(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { googleRefreshToken: true, googleUltimaSincronizacion: true },
    });

    return {
      conectado: Boolean(usuario.googleRefreshToken),
      ultimaSincronizacion: usuario.googleUltimaSincronizacion,
    };
  }

  async desconectar(usuarioId: string) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiraEn: null,
        googleUltimaSincronizacion: null,
      },
    });
    await this.prisma.eventoCalendarioGoogle.deleteMany({ where: { usuarioId } });
  }

  private async obtenerClienteAutenticado(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiraEn: true },
    });

    if (!usuario.googleRefreshToken) {
      throw new BadRequestException('Esta cuenta no está conectada con Google Calendar');
    }

    const cliente = this.crearClienteOAuth();
    cliente.setCredentials({
      access_token: usuario.googleAccessToken,
      refresh_token: usuario.googleRefreshToken,
      expiry_date: usuario.googleTokenExpiraEn?.getTime(),
    });

    // googleapis renueva el access_token solo cuando hace falta; este listener
    // persiste el nuevo token para no tener que pedir consentimiento otra vez
    // en la siguiente sincronización.
    cliente.on('tokens', (tokens) => {
      void this.prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          googleAccessToken: tokens.access_token ?? undefined,
          googleTokenExpiraEn: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
    });

    return cliente;
  }

  async sincronizar(usuarioId: string): Promise<ResumenSincronizacion> {
    const auth = await this.obtenerClienteAutenticado(usuarioId);
    const calendar = google.calendar({ version: 'v3', auth });

    let creados = 0;
    let actualizados = 0;
    let eliminados = 0;
    let importados = 0;
    let errores = 0;

    const tareas = await this.prisma.tarea.findMany({
      where: { usuarioId, fechaLimite: { not: null } },
      include: { eventoGoogle: true },
    });

    for (const tarea of tareas) {
      try {
        // Una tarea archivada tampoco debe seguir ocupando el calendario.
        if (tarea.estado === 'HECHA' || tarea.estado === 'ARCHIVADA') {
          if (tarea.eventoGoogle) {
            await calendar.events
              .delete({ calendarId: 'primary', eventId: tarea.eventoGoogle.googleEventId })
              .catch(() => undefined);
            await this.prisma.eventoCalendarioGoogle.delete({
              where: { id: tarea.eventoGoogle.id },
            });
            eliminados += 1;
          }
          continue;
        }

        const recurso = this.construirEventoDesdeTarea(tarea);

        if (tarea.eventoGoogle) {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: tarea.eventoGoogle.googleEventId,
            requestBody: recurso,
          });
          actualizados += 1;
        } else {
          const respuesta = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: recurso,
          });
          if (respuesta.data.id) {
            await this.prisma.eventoCalendarioGoogle.create({
              data: { usuarioId, googleEventId: respuesta.data.id, tareaId: tarea.id },
            });
          }
          creados += 1;
        }
      } catch (error) {
        // Un evento problemático (p. ej. una instancia de un evento
        // recurrente importado, que Google no deja reescribir como si fuera
        // un evento simple de FocusFlow) no debe tumbar el resto de la
        // sincronización: se cuenta como error y se sigue con las demás.
        errores += 1;
        console.error(`No se pudo sincronizar la tarea ${tarea.id} con Google Calendar`, error);
      }
    }

    const sesiones = await this.prisma.sesionPomodoro.findMany({
      where: { usuarioId, fase: 'TRABAJO', eventoGoogle: null },
      include: { tarea: { select: { titulo: true } } },
      orderBy: { completadaEn: 'desc' },
      take: LIMITE_SESIONES_POR_SINCRONIZACION,
    });

    for (const sesion of sesiones) {
      try {
        const respuesta = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: this.construirEventoDesdeSesion(sesion),
        });
        if (respuesta.data.id) {
          await this.prisma.eventoCalendarioGoogle.create({
            data: { usuarioId, googleEventId: respuesta.data.id, sesionPomodoroId: sesion.id },
          });
          creados += 1;
        }
      } catch (error) {
        errores += 1;
        console.error(
          `No se pudo empujar la sesión de Pomodoro ${sesion.id} a Google Calendar`,
          error,
        );
      }
    }

    const eventosConocidos = await this.prisma.eventoCalendarioGoogle.findMany({
      where: { usuarioId },
      select: { googleEventId: true, tareaId: true },
    });
    const mapaConocidos = new Map(eventosConocidos.map((e) => [e.googleEventId, e.tareaId]));

    const ahora = new Date();
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() + DIAS_VENTANA_IMPORTACION);

    const listado = await calendar.events.list({
      calendarId: 'primary',
      timeMin: ahora.toISOString(),
      timeMax: limite.toISOString(),
      singleEvents: true,
    });

    for (const evento of listado.data.items ?? []) {
      try {
        if (!evento.id || evento.status === 'cancelled' || !evento.summary) continue;
        const fechaInicioTexto = evento.start?.dateTime ?? evento.start?.date;
        if (!fechaInicioTexto) continue;
        const fechaEvento = new Date(fechaInicioTexto);
        // Solo un evento con hora (dateTime) tiene una duración real que
        // conservar; uno de todo el día (date) no la necesita.
        const duracionEvento =
          evento.start?.dateTime && evento.end?.dateTime
            ? Math.max(
                5,
                Math.round(
                  (new Date(evento.end.dateTime).getTime() - fechaEvento.getTime()) / 60000,
                ),
              )
            : undefined;

        if (mapaConocidos.has(evento.id)) {
          const tareaId = mapaConocidos.get(evento.id);
          if (!tareaId) continue; // era un evento de sesión de Pomodoro: esos no se reimportan ni actualizan
          const tareaActual = tareas.find((t) => t.id === tareaId);
          if (!tareaActual) continue;
          const fechaCambiada =
            !tareaActual.fechaLimite || !mismoDia(tareaActual.fechaLimite, fechaEvento);
          if (tareaActual.titulo !== evento.summary || fechaCambiada) {
            await this.prisma.tarea.update({
              where: { id: tareaId },
              data: { titulo: evento.summary, fechaLimite: fechaEvento, duracionMinutos: duracionEvento },
            });
            actualizados += 1;
          }
          continue;
        }

        const tareaImportada = await this.prisma.tarea.create({
          data: {
            titulo: evento.summary,
            fechaLimite: fechaEvento,
            duracionMinutos: duracionEvento,
            usuarioId,
          },
        });
        await this.prisma.eventoCalendarioGoogle.create({
          data: { usuarioId, googleEventId: evento.id, tareaId: tareaImportada.id },
        });
        importados += 1;
      } catch (error) {
        errores += 1;
        console.error(`No se pudo importar el evento ${evento.id} de Google Calendar`, error);
      }
    }

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { googleUltimaSincronizacion: new Date() },
    });

    return { creados, actualizados, eliminados, importados, errores };
  }

  private construirEventoDesdeTarea(tarea: {
    titulo: string;
    descripcion: string | null;
    fechaLimite: Date | null;
    duracionMinutos: number | null;
  }): calendar_v3.Schema$Event {
    const inicio = tarea.fechaLimite!;

    if (!tieneHoraInicio(inicio)) {
      const fecha = inicio.toISOString().slice(0, 10);
      return {
        summary: tarea.titulo,
        description: tarea.descripcion ?? undefined,
        start: { date: fecha },
        end: { date: fecha },
        extendedProperties: { private: { focusflow: 'true' } },
      };
    }

    const duracionMinutos = tarea.duracionMinutos ?? DURACION_MINUTOS_POR_DEFECTO;
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
    return {
      summary: tarea.titulo,
      description: tarea.descripcion ?? undefined,
      start: { dateTime: inicio.toISOString() },
      end: { dateTime: fin.toISOString() },
      extendedProperties: { private: { focusflow: 'true' } },
    };
  }

  private construirEventoDesdeSesion(sesion: {
    completadaEn: Date;
    duracionSegundos: number;
    tarea: { titulo: string } | null;
  }): calendar_v3.Schema$Event {
    const fin = sesion.completadaEn;
    const inicio = new Date(fin.getTime() - sesion.duracionSegundos * 1000);
    return {
      summary: sesion.tarea ? `🍅 ${sesion.tarea.titulo}` : '🍅 Pomodoro',
      start: { dateTime: inicio.toISOString() },
      end: { dateTime: fin.toISOString() },
      extendedProperties: { private: { focusflow: 'true' } },
    };
  }
}
