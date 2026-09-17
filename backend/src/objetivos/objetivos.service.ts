import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoTarea } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { ActualizarObjetivoDto } from './dto/actualizar-objetivo.dto.js';
import type { CrearObjetivoDto } from './dto/crear-objetivo.dto.js';

@Injectable()
export class ObjetivosService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async crear(usuarioId: string, datos: CrearObjetivoDto) {
    return this.prisma.objetivo.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        usuarioId,
      },
    });
  }

  async listarPorUsuario(usuarioId: string) {
    const objetivos = await this.prisma.objetivo.findMany({
      where: { usuarioId },
      include: { tareas: { select: { estado: true } } },
      orderBy: { creadoEn: 'desc' },
    });

    return objetivos.map(({ tareas, ...objetivo }) => ({
      ...objetivo,
      totalTareas: tareas.length,
      tareasCompletadas: tareas.filter((tarea) => tarea.estado === EstadoTarea.HECHA).length,
    }));
  }

  async obtenerUno(usuarioId: string, id: string) {
    const objetivo = await this.prisma.objetivo.findFirst({
      where: { id, usuarioId },
      include: { tareas: { orderBy: { creadoEn: 'asc' } } },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo no encontrado');
    }

    return objetivo;
  }

  async actualizar(usuarioId: string, id: string, datos: ActualizarObjetivoDto) {
    await this.verificarPropiedad(usuarioId, id);

    return this.prisma.objetivo.update({
      where: { id },
      data: datos,
    });
  }

  async eliminar(usuarioId: string, id: string) {
    await this.verificarPropiedad(usuarioId, id);
    await this.prisma.objetivo.delete({ where: { id } });
  }

  private async verificarPropiedad(usuarioId: string, id: string) {
    const objetivo = await this.prisma.objetivo.findFirst({
      where: { id, usuarioId },
      select: { id: true },
    });

    if (!objetivo) {
      throw new NotFoundException('Objetivo no encontrado');
    }
  }
}
