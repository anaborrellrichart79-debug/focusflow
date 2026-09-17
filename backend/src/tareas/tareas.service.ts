import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { ActualizarTareaDto } from './dto/actualizar-tarea.dto.js';
import type { CrearTareaDto } from './dto/crear-tarea.dto.js';
import type { FiltrarTareasDto } from './dto/filtrar-tareas.dto.js';

@Injectable()
export class TareasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async crear(usuarioId: string, datos: CrearTareaDto) {
    if (datos.objetivoId) {
      await this.verificarPropiedadObjetivo(usuarioId, datos.objetivoId);
    }

    return this.prisma.tarea.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        objetivoId: datos.objetivoId,
        usuarioId,
      },
    });
  }

  async listarPorUsuario(usuarioId: string, filtros: FiltrarTareasDto) {
    return this.prisma.tarea.findMany({
      where: {
        usuarioId,
        objetivoId: filtros.objetivoId,
        estado: filtros.estado,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerUna(usuarioId: string, id: string) {
    const tarea = await this.prisma.tarea.findFirst({ where: { id, usuarioId } });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return tarea;
  }

  async actualizar(usuarioId: string, id: string, datos: ActualizarTareaDto) {
    await this.obtenerUna(usuarioId, id);

    if (datos.objetivoId) {
      await this.verificarPropiedadObjetivo(usuarioId, datos.objetivoId);
    }

    return this.prisma.tarea.update({
      where: { id },
      data: datos,
    });
  }

  async eliminar(usuarioId: string, id: string) {
    await this.obtenerUna(usuarioId, id);
    await this.prisma.tarea.delete({ where: { id } });
  }

  private async verificarPropiedadObjetivo(usuarioId: string, objetivoId: string) {
    const objetivo = await this.prisma.objetivo.findFirst({
      where: { id: objetivoId, usuarioId },
      select: { id: true },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo no encontrado');
    }
  }
}
