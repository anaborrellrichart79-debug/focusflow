import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { ActualizarSubtareaDto } from './dto/actualizar-subtarea.dto.js';
import type { CrearSubtareaDto } from './dto/crear-subtarea.dto.js';

@Injectable()
export class SubtareasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async crear(usuarioId: string, tareaId: string, datos: CrearSubtareaDto) {
    await this.verificarPropiedadTarea(usuarioId, tareaId);

    return this.prisma.subtarea.create({
      data: { titulo: datos.titulo, tareaId },
    });
  }

  async actualizar(usuarioId: string, id: string, datos: ActualizarSubtareaDto) {
    await this.verificarPropiedad(usuarioId, id);

    return this.prisma.subtarea.update({
      where: { id },
      data: datos,
    });
  }

  async eliminar(usuarioId: string, id: string) {
    await this.verificarPropiedad(usuarioId, id);
    await this.prisma.subtarea.delete({ where: { id } });
  }

  private async verificarPropiedadTarea(usuarioId: string, tareaId: string) {
    const tarea = await this.prisma.tarea.findFirst({
      where: { id: tareaId, usuarioId },
      select: { id: true },
    });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }
  }

  private async verificarPropiedad(usuarioId: string, id: string) {
    const subtarea = await this.prisma.subtarea.findFirst({
      where: { id, tarea: { usuarioId } },
      select: { id: true },
    });

    if (!subtarea) {
      throw new NotFoundException('Subtarea no encontrada');
    }
  }
}
