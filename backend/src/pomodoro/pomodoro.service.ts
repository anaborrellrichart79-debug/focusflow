import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { CrearSesionPomodoroDto } from './dto/crear-sesion-pomodoro.dto.js';

// 100 en vez de un número más pequeño para que las estadísticas de "hoy"/"esta
// semana" de PaginaEstadisticas tengan margen suficiente sin necesitar un
// endpoint de agregación propio (se calculan en el frontend, igual que el
// resto de Estadísticas).
const LIMITE_HISTORIAL = 100;

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
