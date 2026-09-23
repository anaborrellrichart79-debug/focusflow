import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { AsignarTareaDto, RevisarTareaDto } from './dto/familia.dto.js';

// Sin letras ni números que se confundan al dictarlos (O/0, I/1).
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LONGITUD_CODIGO = 6;
const VALIDEZ_CODIGO_MS = 48 * 60 * 60 * 1000;

export const DATOS_PERSONA = { id: true, nombre: true, correo: true } as const;

export function nombreVisible(persona: {
  nombre: string | null;
  correo: string;
}) {
  return persona.nombre ?? persona.correo;
}

// Vínculo familiar entre un responsable (padre, madre, tutor) y la persona
// que supervisa. El responsable solo ve las tareas que le han pedido revisar o
// que él mismo ha asignado, nunca el resto de la cuenta.
@Injectable()
export class FamiliaService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async obtener(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: {
        codigoVinculo: true,
        codigoVinculoExpiraEn: true,
        vinculosComoResponsable: {
          select: { id: true, supervisado: { select: DATOS_PERSONA } },
        },
        vinculosComoSupervisado: {
          select: { id: true, responsable: { select: DATOS_PERSONA } },
        },
      },
    });
    const codigoVigente =
      usuario.codigoVinculo &&
      usuario.codigoVinculoExpiraEn &&
      usuario.codigoVinculoExpiraEn > new Date();

    return {
      codigo: codigoVigente
        ? {
            codigo: usuario.codigoVinculo,
            expiraEn: usuario.codigoVinculoExpiraEn,
          }
        : null,
      supervisados: usuario.vinculosComoResponsable.map((v) => ({
        vinculoId: v.id,
        ...v.supervisado,
      })),
      responsables: usuario.vinculosComoSupervisado.map((v) => ({
        vinculoId: v.id,
        ...v.responsable,
      })),
    };
  }

  // El supervisado genera el código y se lo da en persona a su responsable.
  async generarCodigo(usuarioId: string) {
    const expiraEn = new Date(Date.now() + VALIDEZ_CODIGO_MS);
    for (let intento = 0; intento < 5; intento++) {
      const codigo = Array.from(
        { length: LONGITUD_CODIGO },
        () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)],
      ).join('');
      const enUso = await this.prisma.usuario.findUnique({
        where: { codigoVinculo: codigo },
      });
      if (enUso) continue;
      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { codigoVinculo: codigo, codigoVinculoExpiraEn: expiraEn },
      });
      return { codigo, expiraEn };
    }
    throw new ConflictException(
      'No se pudo generar un código, inténtalo de nuevo',
    );
  }

  // Quien introduce el código pasa a ser responsable de quien lo generó.
  async vincular(responsableId: string, codigoIntroducido: string) {
    const codigo = codigoIntroducido.trim().toUpperCase();
    const supervisado = await this.prisma.usuario.findUnique({
      where: { codigoVinculo: codigo },
      select: { ...DATOS_PERSONA, codigoVinculoExpiraEn: true },
    });
    if (
      !supervisado ||
      !supervisado.codigoVinculoExpiraEn ||
      supervisado.codigoVinculoExpiraEn < new Date()
    ) {
      throw new BadRequestException('El código no es válido o ha caducado');
    }
    if (supervisado.id === responsableId) {
      throw new BadRequestException(
        'No puedes vincularte con tu propia cuenta',
      );
    }

    const existente = await this.prisma.vinculoFamiliar.findUnique({
      where: {
        responsableId_supervisadoId: {
          responsableId,
          supervisadoId: supervisado.id,
        },
      },
    });
    if (existente) throw new ConflictException('Ya estáis vinculados');

    const [vinculo] = await this.prisma.$transaction([
      this.prisma.vinculoFamiliar.create({
        data: { responsableId, supervisadoId: supervisado.id },
      }),
      // Un solo uso.
      this.prisma.usuario.update({
        where: { id: supervisado.id },
        data: { codigoVinculo: null, codigoVinculoExpiraEn: null },
      }),
    ]);

    return {
      vinculoId: vinculo.id,
      id: supervisado.id,
      nombre: supervisado.nombre,
      correo: supervisado.correo,
    };
  }

  // Cualquiera de los dos puede deshacer el vínculo. Las tareas del
  // supervisado dejan de tener a ese responsable como revisor.
  async desvincular(usuarioId: string, vinculoId: string) {
    const vinculo = await this.prisma.vinculoFamiliar.findFirst({
      where: {
        id: vinculoId,
        OR: [{ responsableId: usuarioId }, { supervisadoId: usuarioId }],
      },
    });
    if (!vinculo) throw new NotFoundException('Vínculo no encontrado');

    await this.prisma.$transaction([
      this.prisma.tarea.updateMany({
        where: {
          usuarioId: vinculo.supervisadoId,
          revisorId: vinculo.responsableId,
        },
        data: {
          revisorId: null,
          estadoRevision: null,
          comentarioRevision: null,
        },
      }),
      this.prisma.vinculoFamiliar.delete({ where: { id: vinculo.id } }),
    ]);
  }

  async comprobarVinculo(responsableId: string, supervisadoId: string) {
    const vinculo = await this.prisma.vinculoFamiliar.findUnique({
      where: { responsableId_supervisadoId: { responsableId, supervisadoId } },
    });
    if (!vinculo)
      throw new NotFoundException('Esa persona no está vinculada contigo');
  }

  async listarTareasSupervisado(responsableId: string, supervisadoId: string) {
    await this.comprobarVinculo(responsableId, supervisadoId);
    return this.prisma.tarea.findMany({
      where: {
        usuarioId: supervisadoId,
        OR: [{ revisorId: responsableId }, { creadaPorId: responsableId }],
      },
      include: { subtareas: { orderBy: { creadoEn: 'asc' } } },
      orderBy: { actualizadoEn: 'desc' },
    });
  }

  async asignarTarea(
    responsableId: string,
    supervisadoId: string,
    datos: AsignarTareaDto,
  ) {
    await this.comprobarVinculo(responsableId, supervisadoId);
    return this.prisma.tarea.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fechaLimite: datos.fechaLimite,
        ambito: datos.ambito,
        tipoEscolar: datos.tipoEscolar,
        usuarioId: supervisadoId,
        creadaPorId: responsableId,
        // Quien la asigna es quien la revisará al terminarla.
        revisorId: responsableId,
      },
      include: { subtareas: true },
    });
  }

  async revisar(
    responsableId: string,
    tareaId: string,
    datos: RevisarTareaDto,
  ) {
    const tarea = await this.prisma.tarea.findFirst({
      where: { id: tareaId, revisorId: responsableId },
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    await this.comprobarVinculo(responsableId, tarea.usuarioId);
    if (tarea.estadoRevision !== 'PENDIENTE') {
      throw new BadRequestException('Esta tarea no está pendiente de revisión');
    }

    const devuelta = datos.decision === 'DEVUELTA';
    const comentario = datos.comentario?.trim() || null;
    const responsable = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: responsableId },
      select: { nombre: true, correo: true },
    });

    const [actualizada] = await this.prisma.$transaction([
      this.prisma.tarea.update({
        where: { id: tareaId },
        data: {
          estadoRevision: datos.decision,
          comentarioRevision: comentario,
          // Devuelta: vuelve a estar en marcha para que la corrija.
          ...(devuelta ? { estado: 'EN_PROCESO' as const } : {}),
        },
        include: { subtareas: { orderBy: { creadoEn: 'asc' } } },
      }),
      this.prisma.aviso.create({
        data: {
          usuarioId: tarea.usuarioId,
          tareaId,
          tipo: 'REVISION_RESUELTA',
          clave: `revision-resuelta:${tareaId}:${Date.now()}`,
          datos: {
            titulo: tarea.titulo,
            nombre: nombreVisible(responsable),
            decision: datos.decision,
            comentario,
          },
        },
      }),
    ]);
    return actualizada;
  }
}
