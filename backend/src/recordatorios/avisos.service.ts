import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';

const MAXIMO_AVISOS_LISTADOS = 100;

@Injectable()
export class AvisosService {
  constructor(private readonly prisma: ServicioPrisma) {}

  listar(usuarioId: string) {
    return this.prisma.aviso.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
      take: MAXIMO_AVISOS_LISTADOS,
    });
  }

  // El navegador ya ha enseñado la notificación: no se vuelve a sonar.
  async marcarMostrados(usuarioId: string, ids: string[]) {
    await this.prisma.aviso.updateMany({
      where: { usuarioId, id: { in: ids }, mostradoEn: null },
      data: { mostradoEn: new Date() },
    });
  }

  async marcarLeido(usuarioId: string, id: string) {
    const { count } = await this.prisma.aviso.updateMany({
      where: { id, usuarioId },
      data: { leidoEn: new Date() },
    });
    if (count === 0) throw new NotFoundException('Aviso no encontrado');
  }

  async marcarTodosLeidos(usuarioId: string) {
    const ahora = new Date();
    await this.prisma.aviso.updateMany({
      where: { usuarioId, leidoEn: null },
      data: { leidoEn: ahora, mostradoEn: ahora },
    });
  }

  // "Ya la he revisado" desde la alarma de emergencia: toca la tarea (su
  // actualizadoEn vuelve a ser hoy, así que el contador de días sin tocar se
  // reinicia) y da por leídas sus alarmas pendientes.
  async marcarTareaRevisada(usuarioId: string, tareaId: string) {
    const tarea = await this.prisma.tarea.findFirst({
      where: { id: tareaId, usuarioId },
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');

    const ahora = new Date();
    await this.prisma.tarea.update({
      where: { id: tareaId },
      data: { actualizadoEn: ahora },
    });
    await this.prisma.aviso.updateMany({
      where: { usuarioId, tareaId, tipo: 'EMERGENCIA', leidoEn: null },
      data: { leidoEn: ahora, mostradoEn: ahora },
    });
  }
}
