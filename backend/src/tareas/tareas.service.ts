import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoTarea, Recurrencia } from '../generated/prisma/enums.js';
import type { TareaModel } from '../generated/prisma/models.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { ActualizarTareaDto } from './dto/actualizar-tarea.dto.js';
import type { CrearTareaDto } from './dto/crear-tarea.dto.js';
import type { FiltrarTareasDto } from './dto/filtrar-tareas.dto.js';

const INCLUIR_RELACIONES = {
  subtareas: { orderBy: { creadoEn: 'asc' as const } },
  etiquetas: true,
  asignaturaHorario: {
    select: { id: true, color: true, asignatura: { select: { nombre: true } } },
  },
};

@Injectable()
export class TareasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  async crear(usuarioId: string, datos: CrearTareaDto) {
    if (datos.objetivoId) {
      await this.verificarPropiedadObjetivo(usuarioId, datos.objetivoId);
    }
    if (datos.asignaturaHorarioId) {
      await this.verificarPropiedadAsignaturaHorario(usuarioId, datos.asignaturaHorarioId);
    }

    return this.prisma.tarea.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        objetivoId: datos.objetivoId,
        fechaLimite: datos.fechaLimite,
        tiempoEstimadoMinutos: datos.tiempoEstimadoMinutos,
        duracionMinutos: datos.duracionMinutos,
        ambito: datos.ambito,
        tipoEscolar: datos.tipoEscolar,
        asignaturaHorarioId: datos.asignaturaHorarioId,
        usuarioId,
        etiquetas: this.construirEtiquetasCrear(usuarioId, datos.etiquetas),
      },
      include: INCLUIR_RELACIONES,
    });
  }

  async listarPorUsuario(usuarioId: string, filtros: FiltrarTareasDto) {
    return this.prisma.tarea.findMany({
      where: {
        usuarioId,
        objetivoId: filtros.objetivoId,
        estado: filtros.estado,
      },
      include: INCLUIR_RELACIONES,
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
    const tareaOriginal = await this.obtenerUna(usuarioId, id);

    if (datos.objetivoId) {
      await this.verificarPropiedadObjetivo(usuarioId, datos.objetivoId);
    }
    if (datos.asignaturaHorarioId) {
      await this.verificarPropiedadAsignaturaHorario(usuarioId, datos.asignaturaHorarioId);
    }

    const { etiquetas, ...resto } = datos;

    const tareaActualizada = await this.prisma.tarea.update({
      where: { id },
      data: {
        ...resto,
        etiquetas: this.construirEtiquetasActualizar(usuarioId, etiquetas),
      },
      include: INCLUIR_RELACIONES,
    });

    if (
      datos.estado === EstadoTarea.HECHA &&
      tareaOriginal.estado !== EstadoTarea.HECHA &&
      tareaOriginal.recurrencia !== Recurrencia.NINGUNA
    ) {
      await this.crearSiguienteOcurrencia(usuarioId, tareaOriginal);
    }

    return tareaActualizada;
  }

  async eliminar(usuarioId: string, id: string) {
    await this.obtenerUna(usuarioId, id);
    await this.prisma.tarea.delete({ where: { id } });
  }

  private construirEtiquetasCrear(usuarioId: string, nombres: string[] | undefined) {
    if (!nombres) return undefined;

    return {
      connectOrCreate: this.limpiarNombres(nombres).map((nombre) => ({
        where: { usuarioId_nombre: { usuarioId, nombre } },
        create: { nombre, usuarioId },
      })),
    };
  }

  private construirEtiquetasActualizar(usuarioId: string, nombres: string[] | undefined) {
    if (!nombres) return undefined;

    return {
      set: [],
      connectOrCreate: this.limpiarNombres(nombres).map((nombre) => ({
        where: { usuarioId_nombre: { usuarioId, nombre } },
        create: { nombre, usuarioId },
      })),
    };
  }

  private limpiarNombres(nombres: string[]) {
    return [...new Set(nombres.map((nombre) => nombre.trim()).filter(Boolean))];
  }

  // Al completar una tarea recurrente se crea automáticamente la siguiente
  // ocurrencia (misma tarea, nueva fechaLimite), sin etiquetas ni subtareas:
  // esas son específicas de la ejecución que se acaba de completar, no de la
  // rutina en sí.
  private async crearSiguienteOcurrencia(usuarioId: string, tareaOriginal: TareaModel) {
    const fechaBase = tareaOriginal.fechaLimite ?? new Date();
    const fechaLimite = new Date(fechaBase);
    if (tareaOriginal.recurrencia === Recurrencia.DIARIA) {
      fechaLimite.setDate(fechaLimite.getDate() + 1);
    } else if (tareaOriginal.recurrencia === Recurrencia.SEMANAL) {
      fechaLimite.setDate(fechaLimite.getDate() + 7);
    }

    await this.prisma.tarea.create({
      data: {
        titulo: tareaOriginal.titulo,
        descripcion: tareaOriginal.descripcion,
        objetivoId: tareaOriginal.objetivoId,
        urgente: tareaOriginal.urgente,
        importante: tareaOriginal.importante,
        recurrencia: tareaOriginal.recurrencia,
        ambito: tareaOriginal.ambito,
        tipoEscolar: tareaOriginal.tipoEscolar,
        asignaturaHorarioId: tareaOriginal.asignaturaHorarioId,
        fechaLimite,
        usuarioId,
      },
    });
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

  private async verificarPropiedadAsignaturaHorario(
    usuarioId: string,
    asignaturaHorarioId: string,
  ) {
    const asignatura = await this.prisma.asignaturaHorario.findFirst({
      where: { id: asignaturaHorarioId, horario: { usuarioId } },
      select: { id: true },
    });

    if (!asignatura) {
      throw new NotFoundException('Asignatura no encontrada en tus horarios');
    }
  }
}
