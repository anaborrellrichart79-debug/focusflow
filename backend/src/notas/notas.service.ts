import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type {
  ActualizarNotaDto,
  CrearNotaDto,
  FiltrarNotasDto,
} from './dto/notas.dto.js';

const INCLUIR_VINCULOS = {
  tarea: { select: { id: true, titulo: true } },
  objetivo: { select: { id: true, titulo: true } },
};

// Notas (texto libre, con casilla opcional) y to-dos (siempre con casilla),
// sueltos o asociados a una tarea o a un objetivo del propio usuario.
@Injectable()
export class NotasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  listar(usuarioId: string, filtros: FiltrarNotasDto) {
    return this.prisma.nota.findMany({
      where: {
        usuarioId,
        tipo: filtros.tipo,
        tareaId: filtros.tareaId,
        objetivoId: filtros.objetivoId,
      },
      include: INCLUIR_VINCULOS,
      // Pendientes primero; dentro de cada grupo, la más reciente arriba.
      orderBy: [{ completada: 'asc' }, { creadoEn: 'desc' }],
    });
  }

  async crear(usuarioId: string, datos: CrearNotaDto) {
    await this.comprobarVinculos(usuarioId, datos.tareaId, datos.objetivoId);
    return this.prisma.nota.create({
      data: {
        tipo: datos.tipo,
        contenido: datos.contenido.trim(),
        conCasilla: datos.tipo === 'TODO' ? true : (datos.conCasilla ?? false),
        tareaId: datos.tareaId,
        objetivoId: datos.objetivoId,
        usuarioId,
      },
      include: INCLUIR_VINCULOS,
    });
  }

  async actualizar(usuarioId: string, id: string, datos: ActualizarNotaDto) {
    const nota = await this.obtenerPropia(usuarioId, id);
    await this.comprobarVinculos(usuarioId, datos.tareaId, datos.objetivoId);
    if (nota.tipo === 'TODO' && datos.conCasilla === false) {
      throw new BadRequestException('Un to-do siempre tiene casilla');
    }

    return this.prisma.nota.update({
      where: { id },
      data: {
        contenido: datos.contenido?.trim(),
        conCasilla: datos.conCasilla,
        // Quitar la casilla de una nota la deja sin marcar.
        completada: datos.conCasilla === false ? false : datos.completada,
        tareaId: datos.tareaId,
        objetivoId: datos.objetivoId,
      },
      include: INCLUIR_VINCULOS,
    });
  }

  async eliminar(usuarioId: string, id: string) {
    await this.obtenerPropia(usuarioId, id);
    await this.prisma.nota.delete({ where: { id } });
  }

  private async obtenerPropia(usuarioId: string, id: string) {
    const nota = await this.prisma.nota.findFirst({ where: { id, usuarioId } });
    if (!nota) throw new NotFoundException('Nota no encontrada');
    return nota;
  }

  // Solo se puede asociar a tareas y objetivos propios.
  private async comprobarVinculos(
    usuarioId: string,
    tareaId: string | null | undefined,
    objetivoId: string | null | undefined,
  ) {
    if (tareaId) {
      const tarea = await this.prisma.tarea.findFirst({
        where: { id: tareaId, usuarioId },
      });
      if (!tarea) throw new NotFoundException('Tarea no encontrada');
    }
    if (objetivoId) {
      const objetivo = await this.prisma.objetivo.findFirst({
        where: { id: objetivoId, usuarioId },
      });
      if (!objetivo) throw new NotFoundException('Objetivo no encontrado');
    }
  }
}
