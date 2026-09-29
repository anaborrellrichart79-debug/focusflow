import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import {
  construirCalendario,
  elegirCurso,
  type CalendarioCurso,
  type FicheroCalendario,
  type PeriodoNoLectivo,
} from './calendario-escolar.js';
import type { CrearDiaNoLectivoDto } from './dto/recordatorios.dto.js';
import { obtenerHoraLocal } from './hora-local.util.js';

const CARPETA_POR_DEFECTO = 'datos/calendarios-escolares';

@Injectable()
export class CalendarioEscolarService {
  private readonly logger = new Logger(CalendarioEscolarService.name);
  // Lo leído de la carpeta, con la "huella" (nombres + fechas de modificación)
  // que tenía: si alguien añade o corrige un fichero, se vuelve a leer sin
  // reiniciar el servidor.
  private cache: { huella: string; cursos: CalendarioCurso[] } | null = null;

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly config: ConfigService,
  ) {}

  private carpeta() {
    return resolve(this.config.get<string>('CALENDARIOS_ESCOLARES_DIR') || CARPETA_POR_DEFECTO);
  }

  // Todos los cursos válidos de la carpeta. Un fichero con errores se ignora
  // (con un aviso que dice qué falla) en vez de dejar la app sin calendario.
  cursosDisponibles(): CalendarioCurso[] {
    const carpeta = this.carpeta();
    let ficheros: string[];
    try {
      ficheros = readdirSync(carpeta).filter((nombre) => nombre.endsWith('.json')).sort();
    } catch {
      this.logger.warn(`No se encuentra la carpeta de calendarios escolares: ${carpeta}`);
      return [];
    }
    const huella = ficheros.map((nombre) => `${nombre}:${statSync(join(carpeta, nombre)).mtimeMs}`).join('|');
    if (this.cache?.huella === huella) return this.cache.cursos;

    const cursos: CalendarioCurso[] = [];
    for (const nombre of ficheros) {
      try {
        const fichero = JSON.parse(readFileSync(join(carpeta, nombre), 'utf-8')) as FicheroCalendario;
        cursos.push(construirCalendario(fichero));
      } catch (error) {
        this.logger.warn(`Calendario escolar ${nombre} ignorado: ${(error as Error).message}`);
      }
    }
    this.cache = { huella, cursos };
    return cursos;
  }

  cursoActual(ahora = new Date()) {
    const hoy = obtenerHoraLocal(ahora, this.config.get<string>('ZONA_HORARIA') || 'Europe/Madrid').fecha;
    return elegirCurso(this.cursosDisponibles(), hoy);
  }

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
    const curso = this.cursoActual();
    const calendario = horario && curso ? curso.comunidades[horario.comunidad] : null;

    return {
      curso: curso?.curso ?? null,
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
