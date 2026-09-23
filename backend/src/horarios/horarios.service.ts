import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoFranja } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type {
  ActualizarHorarioDto,
  AnadirAsignaturaHorarioDto,
  AsignarSesionDto,
  CrearHorarioDto,
  FranjaDto,
} from './dto/horarios.dto.js';

export const INCLUIR_HORARIO_COMPLETO = {
  curso: true,
  franjas: { orderBy: { orden: 'asc' as const } },
  asignaturas: {
    include: { asignatura: true },
    orderBy: { creadoEn: 'asc' as const },
  },
  sesiones: true,
};

// Plantilla con la que nace un horario nuevo, hasta las 14:00: 5 clases y un
// recreo. Cada centro es distinto (dos recreos, jornada partida con comida y
// clases por la tarde...), así que es solo un punto de partida editable.
export const FRANJAS_POR_DEFECTO: Omit<FranjaDto, 'id'>[] = [
  { horaInicio: '09:00', horaFin: '10:00', tipo: TipoFranja.CLASE },
  { horaInicio: '10:00', horaFin: '11:00', tipo: TipoFranja.CLASE },
  { horaInicio: '11:00', horaFin: '12:00', tipo: TipoFranja.CLASE },
  {
    horaInicio: '12:00',
    horaFin: '12:30',
    tipo: TipoFranja.DESCANSO,
    etiqueta: 'Recreo',
  },
  { horaInicio: '12:30', horaFin: '13:15', tipo: TipoFranja.CLASE },
  { horaInicio: '13:15', horaFin: '14:00', tipo: TipoFranja.CLASE },
];

// Colores vivos, como los de un horario pintado a mano; se asigna el primero
// que el horario aún no usa.
export const PALETA_ASIGNATURAS = [
  '#3B82F6',
  '#FACC15',
  '#22C55E',
  '#EC4899',
  '#F97316',
  '#A855F7',
  '#14B8A6',
  '#EF4444',
  '#FDBA74',
  '#84CC16',
  '#06B6D4',
  '#6366F1',
];

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: ServicioPrisma) {}

  listar(usuarioId: string) {
    return this.prisma.horario.findMany({
      where: { usuarioId },
      include: { curso: true },
      orderBy: { creadoEn: 'desc' },
    });
  }

  // null (no 404) si el usuario todavía no tiene ningún horario activo: es un
  // estado normal, la página muestra "Crear mi horario".
  obtenerActivo(usuarioId: string) {
    return this.prisma.horario.findFirst({
      where: { usuarioId, activo: true },
      include: INCLUIR_HORARIO_COMPLETO,
    });
  }

  async obtenerCompleto(usuarioId: string, id: string) {
    const horario = await this.prisma.horario.findFirst({
      where: { id, usuarioId },
      include: INCLUIR_HORARIO_COMPLETO,
    });
    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }
    return horario;
  }

  async crear(usuarioId: string, datos: CrearHorarioDto) {
    await this.verificarCurso(datos.cursoId);
    // El primero que se crea queda activo; los siguientes, no, hasta que el
    // usuario los active (así crear el del curso que viene no cambia la Agenda).
    const yaTieneActivo = await this.prisma.horario.findFirst({
      where: { usuarioId, activo: true },
    });

    return this.prisma.horario.create({
      data: {
        titulo: datos.titulo.trim(),
        periodo: datos.periodo.trim(),
        cursoId: datos.cursoId,
        comunidad: datos.comunidad,
        activo: !yaTieneActivo,
        usuarioId,
        franjas: {
          create: FRANJAS_POR_DEFECTO.map((franja, orden) => ({
            ...franja,
            orden,
          })),
        },
      },
      include: INCLUIR_HORARIO_COMPLETO,
    });
  }

  async actualizar(usuarioId: string, id: string, datos: ActualizarHorarioDto) {
    await this.obtenerPropio(usuarioId, id);
    if (datos.cursoId) {
      await this.verificarCurso(datos.cursoId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (datos.activo) {
        // Solo un horario activo por usuario.
        await tx.horario.updateMany({
          where: { usuarioId, id: { not: id } },
          data: { activo: false },
        });
      }
      await tx.horario.update({
        where: { id },
        data: {
          titulo: datos.titulo?.trim(),
          periodo: datos.periodo?.trim(),
          cursoId: datos.cursoId,
          comunidad: datos.comunidad,
          activo: datos.activo,
        },
      });
    });

    return this.obtenerCompleto(usuarioId, id);
  }

  async eliminar(usuarioId: string, id: string) {
    await this.obtenerPropio(usuarioId, id);
    await this.prisma.horario.delete({ where: { id } });
  }

  // Sustituye todas las franjas por la lista recibida, en ese orden. Las que
  // traen id se conservan (junto con sus celdas); las que ya no aparecen se
  // borran, y con ellas sus celdas (onDelete: Cascade).
  async reemplazarFranjas(usuarioId: string, id: string, franjas: FranjaDto[]) {
    const horario = await this.obtenerCompleto(usuarioId, id);

    for (const franja of franjas) {
      if (franja.horaInicio >= franja.horaFin) {
        throw new BadRequestException(
          `La franja ${franja.horaInicio}-${franja.horaFin} debe empezar antes de terminar`,
        );
      }
    }

    const idsExistentes = new Set(horario.franjas.map((franja) => franja.id));
    const idsConservados = new Set(
      franjas.filter((franja) => franja.id).map((franja) => franja.id!),
    );
    for (const idConservado of idsConservados) {
      if (!idsExistentes.has(idConservado)) {
        throw new BadRequestException(
          'Una de las franjas no pertenece a este horario',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.franjaHorario.deleteMany({
        where: { horarioId: id, id: { notIn: [...idsConservados] } },
      });
      for (const [orden, franja] of franjas.entries()) {
        const datos = {
          orden,
          horaInicio: franja.horaInicio,
          horaFin: franja.horaFin,
          tipo: franja.tipo,
          etiqueta: franja.etiqueta?.trim() || null,
        };
        if (franja.id) {
          await tx.franjaHorario.update({
            where: { id: franja.id },
            data: datos,
          });
          if (franja.tipo === TipoFranja.DESCANSO) {
            // Una franja que pasa a ser descanso no puede tener clases.
            await tx.sesionClase.deleteMany({ where: { franjaId: franja.id } });
          }
        } else {
          await tx.franjaHorario.create({ data: { ...datos, horarioId: id } });
        }
      }
    });

    return this.obtenerCompleto(usuarioId, id);
  }

  async anadirAsignatura(
    usuarioId: string,
    id: string,
    datos: AnadirAsignaturaHorarioDto,
  ) {
    const horario = await this.obtenerCompleto(usuarioId, id);

    const asignatura = await this.prisma.asignatura.findFirst({
      where: {
        id: datos.asignaturaId,
        cursoId: horario.cursoId,
        OR: [{ usuarioId: null }, { usuarioId }],
      },
    });
    if (!asignatura) {
      throw new NotFoundException(
        'Asignatura no encontrada para el curso de este horario',
      );
    }
    if (
      horario.asignaturas.some(
        (elegida) => elegida.asignaturaId === asignatura.id,
      )
    ) {
      throw new BadRequestException('Esa asignatura ya está en el horario');
    }

    const coloresUsados = new Set(
      horario.asignaturas.map((elegida) => elegida.color),
    );
    const color =
      datos.color ??
      PALETA_ASIGNATURAS.find((candidato) => !coloresUsados.has(candidato)) ??
      PALETA_ASIGNATURAS[
        horario.asignaturas.length % PALETA_ASIGNATURAS.length
      ];

    await this.prisma.asignaturaHorario.create({
      data: { horarioId: id, asignaturaId: asignatura.id, color },
    });
    return this.obtenerCompleto(usuarioId, id);
  }

  async cambiarColorAsignatura(
    usuarioId: string,
    id: string,
    asignaturaHorarioId: string,
    color: string,
  ) {
    await this.obtenerAsignaturaDelHorario(usuarioId, id, asignaturaHorarioId);
    await this.prisma.asignaturaHorario.update({
      where: { id: asignaturaHorarioId },
      data: { color },
    });
    return this.obtenerCompleto(usuarioId, id);
  }

  // Quitarla del horario borra también sus celdas (Cascade); las tareas que la
  // tenían se quedan sin asignatura (SetNull), no se borran.
  async quitarAsignatura(
    usuarioId: string,
    id: string,
    asignaturaHorarioId: string,
  ) {
    await this.obtenerAsignaturaDelHorario(usuarioId, id, asignaturaHorarioId);
    await this.prisma.asignaturaHorario.delete({
      where: { id: asignaturaHorarioId },
    });
    return this.obtenerCompleto(usuarioId, id);
  }

  async asignarSesion(usuarioId: string, id: string, datos: AsignarSesionDto) {
    const horario = await this.obtenerCompleto(usuarioId, id);

    const franja = horario.franjas.find(
      (candidata) => candidata.id === datos.franjaId,
    );
    if (!franja) {
      throw new NotFoundException('Franja no encontrada en este horario');
    }
    if (franja.tipo === TipoFranja.DESCANSO) {
      throw new BadRequestException(
        'En una franja de descanso no se pueden poner clases',
      );
    }

    const claveCelda = {
      franjaId_diaSemana: { franjaId: franja.id, diaSemana: datos.diaSemana },
    };

    if (datos.asignaturaHorarioId === null) {
      await this.prisma.sesionClase.deleteMany({
        where: { franjaId: franja.id, diaSemana: datos.diaSemana },
      });
    } else {
      if (
        !horario.asignaturas.some(
          (elegida) => elegida.id === datos.asignaturaHorarioId,
        )
      ) {
        throw new NotFoundException('Esa asignatura no está en este horario');
      }
      const aula = datos.aula?.trim() || null;
      await this.prisma.sesionClase.upsert({
        where: claveCelda,
        create: {
          horarioId: id,
          franjaId: franja.id,
          diaSemana: datos.diaSemana,
          asignaturaHorarioId: datos.asignaturaHorarioId,
          aula,
        },
        update: { asignaturaHorarioId: datos.asignaturaHorarioId, aula },
      });
    }

    return this.obtenerCompleto(usuarioId, id);
  }

  private async obtenerPropio(usuarioId: string, id: string) {
    const horario = await this.prisma.horario.findFirst({
      where: { id, usuarioId },
    });
    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }
    return horario;
  }

  private async obtenerAsignaturaDelHorario(
    usuarioId: string,
    horarioId: string,
    asignaturaHorarioId: string,
  ) {
    await this.obtenerPropio(usuarioId, horarioId);
    const elegida = await this.prisma.asignaturaHorario.findFirst({
      where: { id: asignaturaHorarioId, horarioId },
    });
    if (!elegida) {
      throw new NotFoundException('Asignatura no encontrada en este horario');
    }
    return elegida;
  }

  private async verificarCurso(cursoId: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }
  }
}
