import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import {
  CALENDARIO_ESCOLAR,
  CURSO_CALENDARIO_ESCOLAR,
  type PeriodoNoLectivo,
} from './calendario-escolar.js';
import type { CrearDiaNoLectivoDto } from './dto/recordatorios.dto.js';

@Injectable()
export class CalendarioEscolarService {
  constructor(private readonly prisma: ServicioPrisma) {}

  // La comunidad sale del horario activo: sin horario, solo cuentan los días
  // no lectivos que haya añadido el propio usuario.
  async obtener(usuarioId: string) {
    const [horario, propios] = await Promise.all([
      this.prisma.horario.findFirst({
        where: { usuarioId, activo: true },
        select: { comunidad: true },
      }),
      this.prisma.diaNoLectivoPropio.findMany({
        where: { usuarioId },
        orderBy: { inicio: 'asc' },
      }),
    ]);
    const calendario = horario ? CALENDARIO_ESCOLAR[horario.comunidad] : null;

    return {
      curso: CURSO_CALENDARIO_ESCOLAR,
      comunidad: horario?.comunidad ?? null,
      inicioClases: calendario?.inicioClases ?? null,
      finClases: calendario?.finClases ?? null,
      periodos: calendario?.periodos ?? [],
      propios,
    };
  }

  async periodosDelUsuario(usuarioId: string): Promise<PeriodoNoLectivo[]> {
    const { periodos, propios } = await this.obtener(usuarioId);
    return [
      ...periodos,
      ...propios.map((propio) => ({
        clave: `propio-${propio.id}`,
        nombre: propio.nombre,
        inicio: propio.inicio,
        fin: propio.fin,
      })),
    ];
  }

  crearPropio(usuarioId: string, datos: CrearDiaNoLectivoDto) {
    if (datos.fin < datos.inicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }
    return this.prisma.diaNoLectivoPropio.create({
      data: {
        nombre: datos.nombre,
        inicio: datos.inicio,
        fin: datos.fin,
        usuarioId,
      },
    });
  }

  async eliminarPropio(usuarioId: string, id: string) {
    const { count } = await this.prisma.diaNoLectivoPropio.deleteMany({
      where: { id, usuarioId },
    });
    if (count === 0)
      throw new NotFoundException('Día no lectivo no encontrado');
  }
}
