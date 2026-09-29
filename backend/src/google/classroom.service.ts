import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, type classroom_v1 } from 'googleapis';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { sumarDias } from '../recordatorios/calendario-escolar.js';
import { obtenerHoraLocal } from '../recordatorios/hora-local.util.js';
import { GoogleService, tieneAmbitosClassroom } from './google.service.js';

// Trabajos con fecha de entrega de hace más de estos días no se importan
// (evita traer los del curso pasado si la clase sigue activa).
const DIAS_ATRAS_IMPORTACION = 30;
const ENTREGADO = new Set(['TURNED_IN', 'RETURNED']);

export interface ResumenClassroom {
  cursos: number;
  nuevas: number;
  actualizadas: number;
}

// Classroom da la fecha de entrega en UTC (dueDate + dueTime opcional). En
// FocusFlow las fechas límite son "hora de reloj" local codificada en UTC:
// las 23:59 de Madrid se guardan como 23:59Z. Sin hora, solo la fecha.
export function fechaLimiteDeTrabajo(
  trabajo: Pick<classroom_v1.Schema$CourseWork, 'dueDate' | 'dueTime'>,
  zonaHoraria: string,
): Date | null {
  const { year, month, day } = trabajo.dueDate ?? {};
  if (!year || !month || !day) return null;
  const fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!trabajo.dueTime || trabajo.dueTime.hours == null) return new Date(`${fecha}T00:00:00.000Z`);
  const instante = new Date(
    Date.UTC(year, month - 1, day, trabajo.dueTime.hours, trabajo.dueTime.minutes ?? 0),
  );
  const local = obtenerHoraLocal(instante, zonaHoraria);
  return new Date(`${local.fecha}T${local.hora}:00.000Z`);
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

// La asignatura del horario activo cuyo nombre aparece en el de la clase de
// Classroom ("Matemáticas 4º B" → Matemáticas). La de nombre más largo gana
// ("Lengua Castellana y Literatura" antes que una optativa "Lengua").
export function asignaturaDeCurso(
  nombreCurso: string,
  asignaturas: { id: string; nombre: string }[],
): string | null {
  const curso = normalizar(nombreCurso);
  const candidatas = asignaturas
    .filter((asignatura) => curso.includes(normalizar(asignatura.nombre)))
    .sort((a, b) => b.nombre.length - a.nombre.length);
  return candidatas[0]?.id ?? null;
}

// Importa como tareas escolares los trabajos pendientes de entregar de las
// clases de Google Classroom del usuario (solo lectura: nunca escribe en
// Classroom).
@Injectable()
export class ClassroomService {
  private readonly logger = new Logger(ClassroomService.name);

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly googleService: GoogleService,
    private readonly config: ConfigService,
  ) {}

  async importar(usuarioId: string, ahora = new Date()): Promise<ResumenClassroom> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { googleRefreshToken: true, googleAmbitos: true },
    });
    if (!usuario.googleRefreshToken || !tieneAmbitosClassroom(usuario.googleAmbitos)) {
      throw new BadRequestException('Conecta Google Classroom para importar tus deberes');
    }

    const zona = this.config.get<string>('ZONA_HORARIA') || 'Europe/Madrid';
    const desde = sumarDias(obtenerHoraLocal(ahora, zona).fecha, -DIAS_ATRAS_IMPORTACION);
    const auth = await this.googleService.obtenerClienteAutenticado(usuarioId);
    const classroom = google.classroom({ version: 'v1', auth });

    const [horario, importados] = await Promise.all([
      this.prisma.horario.findFirst({
        where: { usuarioId, activo: true },
        select: { asignaturas: { select: { id: true, asignatura: { select: { nombre: true } } } } },
      }),
      this.prisma.trabajoClassroom.findMany({
        where: { usuarioId },
        include: { tarea: { select: { estado: true, titulo: true, fechaLimite: true } } },
      }),
    ]);
    const asignaturas = (horario?.asignaturas ?? []).map((a) => ({ id: a.id, nombre: a.asignatura.nombre }));
    const importadoPorTrabajo = new Map(importados.map((registro) => [registro.trabajoId, registro]));

    const resumen: ResumenClassroom = { cursos: 0, nuevas: 0, actualizadas: 0 };
    try {
      const { data } = await classroom.courses.list({ studentId: 'me', courseStates: ['ACTIVE'], pageSize: 50 });
      for (const curso of data.courses ?? []) {
        if (!curso.id || !curso.name) continue;
        resumen.cursos++;
        const [{ data: trabajos }, { data: entregas }] = await Promise.all([
          classroom.courses.courseWork.list({ courseId: curso.id, courseWorkStates: ['PUBLISHED'], pageSize: 100 }),
          classroom.courses.courseWork.studentSubmissions.list({
            courseId: curso.id,
            courseWorkId: '-',
            userId: 'me',
            pageSize: 100,
          }),
        ]);
        const entregados = new Set(
          (entregas.studentSubmissions ?? [])
            .filter((entrega) => ENTREGADO.has(entrega.state ?? ''))
            .map((entrega) => entrega.courseWorkId),
        );
        const asignaturaHorarioId = asignaturaDeCurso(curso.name, asignaturas);

        for (const trabajo of trabajos.courseWork ?? []) {
          if (!trabajo.id || !trabajo.title || entregados.has(trabajo.id)) continue;
          const fechaLimite = fechaLimiteDeTrabajo(trabajo, zona);
          if (fechaLimite && fechaLimite.toISOString().slice(0, 10) < desde) continue;

          const previo = importadoPorTrabajo.get(trabajo.id);
          if (previo) {
            // Borrada por el usuario (tareaId null) o ya terminada: se respeta.
            if (!previo.tarea || previo.tarea.estado === 'HECHA' || previo.tarea.estado === 'ARCHIVADA') continue;
            const cambiaFecha = (previo.tarea.fechaLimite?.getTime() ?? null) !== (fechaLimite?.getTime() ?? null);
            if (previo.tarea.titulo !== trabajo.title || cambiaFecha) {
              await this.prisma.tarea.update({
                where: { id: previo.tareaId! },
                data: { titulo: trabajo.title, fechaLimite },
              });
              resumen.actualizadas++;
            }
            continue;
          }

          const descripcion = [trabajo.description?.trim(), trabajo.alternateLink].filter(Boolean).join('\n\n');
          await this.prisma.tarea.create({
            data: {
              titulo: trabajo.title,
              descripcion: descripcion || null,
              fechaLimite,
              ambito: 'ESCOLAR',
              tipoEscolar: 'TRABAJO',
              asignaturaHorarioId,
              usuarioId,
              etiquetas: {
                connectOrCreate: {
                  where: { usuarioId_nombre: { usuarioId, nombre: curso.name } },
                  create: { nombre: curso.name, usuarioId },
                },
              },
              trabajoClassroom: { create: { usuarioId, cursoId: curso.id, trabajoId: trabajo.id } },
            },
          });
          resumen.nuevas++;
        }
      }
    } catch (error) {
      throw this.traducirError(error);
    }
    return resumen;
  }

  // Los dos fallos típicos, con un mensaje que dice qué hacer.
  private traducirError(error: unknown) {
    if (error instanceof BadRequestException) return error;
    const estado = (error as { status?: number; code?: number }).status ?? (error as { code?: number }).code;
    const mensaje = (error as Error).message ?? '';
    if (estado === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(mensaje)) {
      return new ServiceUnavailableException('La API de Google Classroom no está activada en el proyecto de Google Cloud');
    }
    if (estado === 401 || estado === 403) {
      return new ForbiddenException('Google no permite que FocusFlow lea tu Classroom (puede que tu centro lo tenga restringido)');
    }
    this.logger.error('Error importando de Google Classroom', error as Error);
    return error;
  }
}
