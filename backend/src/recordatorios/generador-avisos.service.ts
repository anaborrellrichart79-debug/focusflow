import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorreoService } from '../correo/correo.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { TipoAviso } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { sumarDias, type PeriodoNoLectivo } from './calendario-escolar.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';
import {
  obtenerHoraLocal,
  vencimientoEfectivo,
  type HoraLocal,
} from './hora-local.util.js';
import { IaService } from './ia.service.js';
import {
  htmlCorreoAvisos,
  textoAviso,
  type DatosEmergencia,
  type DatosEntrega,
  type DatosRevision,
  type DatosVacaciones,
} from './textos-aviso.js';

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;
// Los avisos más antiguos se borran para que la tabla no crezca sin fin.
const DIAS_CONSERVACION_AVISOS = 90;
const ESTADOS_SIN_EMERGENCIA = ['BAJO_CONTROL', 'POSPUESTA'];

interface TareaPendiente {
  id: string;
  titulo: string;
  fechaLimite: Date | null;
  ambito: string;
  estado: string;
  actualizadoEn: Date;
}

interface AvisoCandidato {
  tipo: TipoAviso;
  clave: string;
  datos: DatosRevision | DatosEntrega | DatosVacaciones | DatosEmergencia;
  tareaId?: string;
  porCorreo: boolean;
}

// Decide qué avisos tocan en cada momento, los guarda (sin repetir ninguno,
// gracias a su "clave" única por usuario), les pide a Ollama un texto más
// humano cuando aporta algo y manda por correo los que lo tengan activado.
@Injectable()
export class GeneradorAvisosService {
  private readonly logger = new Logger(GeneradorAvisosService.name);

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly calendario: CalendarioEscolarService,
    private readonly ia: IaService,
    private readonly correo: CorreoService,
    private readonly config: ConfigService,
  ) {}

  async procesarTodos(ahora = new Date()) {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        consentimientoConfirmado: true,
        OR: [
          { emergenciaActiva: true },
          { recordatorios: { some: { activo: true } } },
        ],
      },
      select: { id: true },
    });

    for (const { id } of usuarios) {
      try {
        await this.procesarUsuario(id, ahora);
      } catch (error) {
        // Un usuario con un problema no deja sin avisos a los demás.
        this.logger.error(
          `Error generando avisos del usuario ${id}`,
          error as Error,
        );
      }
    }

    await this.prisma.aviso.deleteMany({
      where: {
        creadoEn: {
          lt: new Date(ahora.getTime() - DIAS_CONSERVACION_AVISOS * MS_DIA),
        },
      },
    });
  }

  // Devuelve cuántos avisos nuevos se han creado.
  // Con esperarIa: false (el botón "Comprobar ahora") responde en cuanto los
  // avisos están guardados, sin esperar a Ollama ni al correo.
  async procesarUsuario(
    usuarioId: string,
    ahora = new Date(),
    opciones: { esperarIa: boolean } = { esperarIa: true },
  ): Promise<number> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: {
        correo: true,
        emergenciaActiva: true,
        emergenciaDias: true,
        emergenciaPorCorreo: true,
        recordatorios: { where: { activo: true } },
      },
    });
    const pendientes: TareaPendiente[] = await this.prisma.tarea.findMany({
      where: { usuarioId, estado: { notIn: ['HECHA', 'ARCHIVADA'] } },
      select: {
        id: true,
        titulo: true,
        fechaLimite: true,
        ambito: true,
        estado: true,
        actualizadoEn: true,
      },
    });
    const local = obtenerHoraLocal(
      ahora,
      this.config.get<string>('ZONA_HORARIA') || 'Europe/Madrid',
    );

    const candidatos: AvisoCandidato[] = [];
    let periodos: PeriodoNoLectivo[] | null = null;

    for (const recordatorio of usuario.recordatorios) {
      switch (recordatorio.tipo) {
        case 'REVISION_SEMANAL':
          if (
            recordatorio.diaSemana === local.diaSemana &&
            recordatorio.hora != null &&
            local.hora >= recordatorio.hora
          ) {
            candidatos.push({
              tipo: 'REVISION_SEMANAL',
              clave: `revision:${recordatorio.id}:${local.fecha}`,
              datos: this.datosRevision(pendientes, local),
              porCorreo: recordatorio.porCorreo,
            });
          }
          break;

        case 'ENTREGA':
          for (const tarea of pendientes) {
            if (!tarea.fechaLimite || recordatorio.horasAntes == null) continue;
            if (recordatorio.soloEscolar && tarea.ambito !== 'ESCOLAR')
              continue;
            const restante =
              vencimientoEfectivo(tarea.fechaLimite).getTime() -
              local.flotante.getTime();
            if (restante <= 0 || restante > recordatorio.horasAntes * MS_HORA)
              continue;
            candidatos.push({
              tipo: 'ENTREGA',
              // Con la fecha límite en la clave, si la entrega se aplaza el
              // recordatorio vuelve a sonar para la nueva fecha.
              clave: `entrega:${recordatorio.id}:${tarea.id}:${tarea.fechaLimite.toISOString()}`,
              datos: {
                titulo: tarea.titulo,
                fechaLimite: tarea.fechaLimite.toISOString(),
                horasRestantes: Math.ceil(restante / MS_HORA),
              },
              tareaId: tarea.id,
              porCorreo: recordatorio.porCorreo,
            });
          }
          break;

        case 'VACACIONES': {
          if (recordatorio.diasAntes == null) break;
          periodos ??= await this.calendario.periodosDelUsuario(usuarioId);
          for (const periodo of periodos) {
            // Solo entre "diasAntes" días antes y el primer día sin clase: si el
            // recordatorio se crea a mitad de unas vacaciones, no avisa de ellas.
            if (
              local.fecha < sumarDias(periodo.inicio, -recordatorio.diasAntes)
            )
              continue;
            if (local.fecha > periodo.inicio) continue;
            candidatos.push({
              tipo: 'VACACIONES',
              clave: `vacaciones:${recordatorio.id}:${periodo.clave}:${periodo.inicio}`,
              datos: {
                clave: periodo.clave,
                nombre: periodo.nombre,
                inicio: periodo.inicio,
                fin: periodo.fin,
                diasRestantes: Math.round(
                  (Date.parse(periodo.inicio) - Date.parse(local.fecha)) /
                    MS_DIA,
                ),
                tareasAntes: pendientes.filter((tarea) => {
                  const fecha = tarea.fechaLimite?.toISOString().slice(0, 10);
                  return (
                    fecha != null &&
                    fecha >= local.fecha &&
                    fecha < periodo.inicio
                  );
                }).length,
              },
              porCorreo: recordatorio.porCorreo,
            });
          }
          break;
        }
      }
    }

    if (usuario.emergenciaActiva) {
      const limite = ahora.getTime() - usuario.emergenciaDias * MS_DIA;
      for (const tarea of pendientes) {
        if (tarea.actualizadoEn.getTime() > limite) continue;
        // "Bajo control" y "Pospuesta" son decisiones conscientes de no
        // tocarla por ahora: no son olvidos.
        if (ESTADOS_SIN_EMERGENCIA.includes(tarea.estado)) continue;
        candidatos.push({
          tipo: 'EMERGENCIA',
          // Si la tarea se toca y vuelve a quedarse olvidada, es otra alarma.
          clave: `emergencia:${tarea.id}:${tarea.actualizadoEn.toISOString()}`,
          datos: {
            titulo: tarea.titulo,
            diasSinTocar: Math.floor(
              (ahora.getTime() - tarea.actualizadoEn.getTime()) / MS_DIA,
            ),
          },
          tareaId: tarea.id,
          porCorreo: usuario.emergenciaPorCorreo,
        });
      }
    }

    if (candidatos.length === 0) return 0;

    const existentes = await this.prisma.aviso.findMany({
      where: {
        usuarioId,
        clave: { in: candidatos.map((candidato) => candidato.clave) },
      },
      select: { clave: true },
    });
    const clavesExistentes = new Set(existentes.map((aviso) => aviso.clave));
    const nuevos = candidatos.filter(
      (candidato) => !clavesExistentes.has(candidato.clave),
    );
    if (nuevos.length === 0) return 0;

    const creados = await this.prisma.aviso.createManyAndReturn({
      data: nuevos.map((candidato) => ({
        usuarioId,
        tipo: candidato.tipo,
        clave: candidato.clave,
        datos: candidato.datos as unknown as Prisma.InputJsonValue,
        tareaId: candidato.tareaId,
      })),
      // Por si otra pasada (el botón "Comprobar ahora" y el proceso
      // programado a la vez) acaba de crear el mismo aviso.
      skipDuplicates: true,
    });
    if (creados.length === 0) return 0;

    // El aviso ya existe y la app puede enseñarlo; el texto de Ollama (que
    // puede tardar un minuto) y el correo, que lo incluye, van después.
    const clavesCreadas = new Set(creados.map((aviso) => aviso.clave));
    const completar = this.completarAvisos(
      usuario.correo,
      creados,
      nuevos.filter((candidato) => clavesCreadas.has(candidato.clave)),
    );
    if (opciones.esperarIa) {
      await completar;
    } else {
      completar.catch((error: unknown) =>
        this.logger.error('Error completando avisos', error as Error),
      );
    }

    return creados.length;
  }

  private async completarAvisos(
    correo: string,
    creados: { id: string; clave: string; tipo: TipoAviso; datos: unknown }[],
    candidatos: AvisoCandidato[],
  ) {
    const textosIa = await this.redactarConIa(candidatos);
    const avisos = creados.map((aviso) => ({
      ...aviso,
      mensajeIa: textosIa.get(aviso.clave) ?? null,
    }));

    // Agrupados por texto: todas las alarmas de emergencia comparten el suyo.
    const idsPorTexto = new Map<string, string[]>();
    for (const aviso of avisos) {
      if (!aviso.mensajeIa) continue;
      idsPorTexto.set(aviso.mensajeIa, [
        ...(idsPorTexto.get(aviso.mensajeIa) ?? []),
        aviso.id,
      ]);
    }
    for (const [mensajeIa, ids] of idsPorTexto) {
      await this.prisma.aviso.updateMany({
        where: { id: { in: ids } },
        data: { mensajeIa },
      });
    }

    const clavesPorCorreo = new Set(
      candidatos.filter((c) => c.porCorreo).map((c) => c.clave),
    );
    const paraCorreo = avisos.filter((aviso) =>
      clavesPorCorreo.has(aviso.clave),
    );
    if (paraCorreo.length > 0) await this.enviarCorreo(correo, paraCorreo);
  }

  private datosRevision(
    pendientes: TareaPendiente[],
    local: HoraLocal,
  ): DatosRevision {
    const ahora = local.flotante.getTime();
    const conFecha = pendientes.filter((tarea) => tarea.fechaLimite != null);
    const vencimiento = (tarea: TareaPendiente) =>
      vencimientoEfectivo(tarea.fechaLimite!).getTime();

    return {
      pendientes: pendientes.length,
      vencidas: conFecha.filter((tarea) => vencimiento(tarea) < ahora).length,
      proximos7Dias: conFecha.filter(
        (tarea) =>
          vencimiento(tarea) >= ahora &&
          vencimiento(tarea) <= ahora + 7 * MS_DIA,
      ).length,
      titulos: [...conFecha]
        .sort((a, b) => vencimiento(a) - vencimiento(b))
        .slice(0, 10)
        .map((tarea) => tarea.titulo),
    };
  }

  // Ollama solo redacta donde aporta: el resumen de la revisión semanal y un
  // único mensaje para todas las alarmas de emergencia de esta pasada. Las
  // entregas y las vacaciones ya se explican bien con el texto por reglas.
  private async redactarConIa(nuevos: AvisoCandidato[]) {
    const textos = new Map<string, string>();

    for (const candidato of nuevos.filter(
      (c) => c.tipo === 'REVISION_SEMANAL',
    )) {
      const datos = candidato.datos as DatosRevision;
      const texto = await this.ia.redactar(
        'Eres el asistente de FocusFlow, una app de organización para estudiantes. ' +
          'Escribe en castellano, en tono cercano y en un máximo de 3 frases, un resumen de la ' +
          'revisión semanal y qué conviene priorizar. No uses listas ni markdown. ' +
          `Datos: ${textoAviso('REVISION_SEMANAL', datos).cuerpo} ` +
          `Tareas con fecha, de la más urgente a la menos: ${datos.titulos.join('; ') || 'ninguna'}.`,
      );
      if (texto) textos.set(candidato.clave, texto);
    }

    const emergencias = nuevos.filter((c) => c.tipo === 'EMERGENCIA');
    if (emergencias.length > 0) {
      const lista = emergencias
        .slice(0, 10)
        .map((c) => {
          const datos = c.datos as DatosEmergencia;
          return `${datos.titulo} (${datos.diasSinTocar} días)`;
        })
        .join('; ');
      const texto = await this.ia.redactar(
        'Eres el asistente de FocusFlow, una app de organización para estudiantes. ' +
          'Escribe en castellano, en un máximo de 2 frases, un aviso urgente pero amable para que ' +
          `el usuario revise hoy estas tareas olvidadas (${emergencias.length} en total): ${lista}. ` +
          'No uses listas ni markdown.',
      );
      if (texto)
        emergencias.forEach((candidato) => textos.set(candidato.clave, texto));
    }

    return textos;
  }

  private async enviarCorreo(
    destinatario: string,
    avisos: {
      id: string;
      tipo: TipoAviso;
      datos: unknown;
      mensajeIa: string | null;
    }[],
  ) {
    if (!this.correo.estaConfigurado()) return;

    const emergencias = avisos.filter(
      (aviso) => aviso.tipo === 'EMERGENCIA',
    ).length;
    const asunto =
      emergencias > 0
        ? `⚠️ FocusFlow: ${emergencias} tareas llevan días sin revisar`
        : avisos.length === 1
          ? `FocusFlow: ${textoAviso(avisos[0].tipo, avisos[0].datos).titulo}`
          : `FocusFlow: tienes ${avisos.length} recordatorios`;
    const enlaceApp =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    try {
      await this.correo.enviarAviso(
        destinatario,
        asunto,
        htmlCorreoAvisos(avisos, enlaceApp),
      );
      await this.prisma.aviso.updateMany({
        where: { id: { in: avisos.map((aviso) => aviso.id) } },
        data: { correoEnviadoEn: new Date() },
      });
    } catch (error) {
      // El aviso sigue apareciendo en la app aunque el correo falle.
      this.logger.error(
        `No se pudo enviar el correo de avisos a ${destinatario}`,
        error as Error,
      );
    }
  }
}
