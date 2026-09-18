import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { CrearSesionPomodoroDto } from './dto/crear-sesion-pomodoro.dto.js';

const LIMITE_HISTORIAL = 20;

@Injectable()
export class PomodoroService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async registrarSesion(usuarioId: string, datos: CrearSesionPomodoroDto) {
    if (datos.tareaId) {
      await this.verificarPropiedadTarea(usuarioId, datos.tareaId);
    }

    return this.prisma.sesionPomodoro.create({
      data: {
        fase: datos.fase,
        duracionSegundos: datos.duracionSegundos,
        tareaId: datos.tareaId,
        usuarioId,
      },
    });
  }

  async listarPorUsuario(usuarioId: string) {
    return this.prisma.sesionPomodoro.findMany({
      where: { usuarioId },
      include: { tarea: { select: { id: true, titulo: true } } },
      orderBy: { completadaEn: 'desc' },
      take: LIMITE_HISTORIAL,
    });
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
}
