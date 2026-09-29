import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { google } from 'googleapis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { asignaturaDeCurso, ClassroomService, fechaLimiteDeTrabajo } from './classroom.service.js';
import { AMBITOS_CLASSROOM, GoogleService } from './google.service.js';

vi.mock('googleapis', () => ({ google: { classroom: vi.fn() } }));

// 29/09/2026, 12:00 en Madrid.
const AHORA = new Date('2026-09-29T10:00:00Z');

describe('conversiones de Classroom', () => {
  it('la hora de entrega (UTC) pasa a hora de reloj de Madrid; sin hora, solo la fecha', () => {
    // 21:59 UTC en octubre = 23:59 en Madrid (horario de verano).
    expect(
      fechaLimiteDeTrabajo({ dueDate: { year: 2026, month: 10, day: 5 }, dueTime: { hours: 21, minutes: 59 } }, 'Europe/Madrid')?.toISOString(),
    ).toBe('2026-10-05T23:59:00.000Z');
    // 23:30 UTC ya es el día siguiente en Madrid.
    expect(
      fechaLimiteDeTrabajo({ dueDate: { year: 2026, month: 12, day: 1 }, dueTime: { hours: 23, minutes: 30 } }, 'Europe/Madrid')?.toISOString(),
    ).toBe('2026-12-02T00:30:00.000Z');
    expect(fechaLimiteDeTrabajo({ dueDate: { year: 2026, month: 10, day: 5 } }, 'Europe/Madrid')?.toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    );
    expect(fechaLimiteDeTrabajo({}, 'Europe/Madrid')).toBeNull();
  });

  it('asocia la clase a la asignatura del horario cuyo nombre contiene, sin tildes y la más larga', () => {
    const asignaturas = [
      { id: 'mates', nombre: 'Matemáticas' },
      { id: 'lengua', nombre: 'Lengua' },
      { id: 'castellano', nombre: 'Lengua Castellana y Literatura' },
    ];
    expect(asignaturaDeCurso('MATEMATICAS 4º B', asignaturas)).toBe('mates');
    expect(asignaturaDeCurso('Lengua Castellana y Literatura - 4ºB', asignaturas)).toBe('castellano');
    expect(asignaturaDeCurso('Tutoría', asignaturas)).toBeNull();
  });
});

describe('ClassroomService.importar', () => {
  let servicio: ClassroomService;
  const api = {
    courses: {
      list: vi.fn(),
      courseWork: { list: vi.fn(), studentSubmissions: { list: vi.fn() } },
    },
  };
  const prismaFalso = {
    usuario: { findUniqueOrThrow: vi.fn() },
    horario: { findFirst: vi.fn() },
    trabajoClassroom: { findMany: vi.fn() },
    tarea: { create: vi.fn(), update: vi.fn() },
  };

  function trabajo(id: string, titulo: string, dia: number) {
    return { id, title: titulo, description: `Enunciado de ${titulo}`, alternateLink: `https://classroom.google.com/${id}`, dueDate: { year: 2026, month: 10, day: dia } };
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(google.classroom).mockReturnValue(api as never);
    prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({ googleRefreshToken: 'r', googleAmbitos: AMBITOS_CLASSROOM.join(' ') });
    prismaFalso.horario.findFirst.mockResolvedValue({
      asignaturas: [{ id: 'ah-mates', asignatura: { nombre: 'Matemáticas' } }],
    });
    prismaFalso.trabajoClassroom.findMany.mockResolvedValue([]);
    api.courses.list.mockResolvedValue({ data: { courses: [{ id: 'c1', name: 'Matemáticas 4ºB' }] } });
    api.courses.courseWork.list.mockResolvedValue({
      data: {
        courseWork: [
          trabajo('t1', 'Ficha de fracciones', 5),
          trabajo('t2', 'Ya entregado', 6),
          { ...trabajo('t3', 'Del curso pasado', 1), dueDate: { year: 2026, month: 6, day: 10 } },
        ],
      },
    });
    api.courses.courseWork.studentSubmissions.list.mockResolvedValue({
      data: { studentSubmissions: [{ courseWorkId: 't2', state: 'TURNED_IN' }, { courseWorkId: 't1', state: 'CREATED' }] },
    });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: GoogleService, useValue: { obtenerClienteAutenticado: vi.fn().mockResolvedValue({}) } },
        { provide: ConfigService, useValue: { get: () => 'Europe/Madrid' } },
      ],
    }).compile();
    servicio = modulo.get(ClassroomService);
  });

  it('crea solo los trabajos pendientes y recientes, como tareas escolares con asignatura, etiqueta y enlace', async () => {
    const resumen = await servicio.importar('hija', AHORA);

    expect(resumen).toEqual({ cursos: 1, nuevas: 1, actualizadas: 0 });
    expect(api.courses.list).toHaveBeenCalledWith(expect.objectContaining({ studentId: 'me', courseStates: ['ACTIVE'] }));
    expect(prismaFalso.tarea.create).toHaveBeenCalledTimes(1);
    expect(prismaFalso.tarea.create.mock.calls[0][0].data).toMatchObject({
      titulo: 'Ficha de fracciones',
      descripcion: 'Enunciado de Ficha de fracciones\n\nhttps://classroom.google.com/t1',
      fechaLimite: new Date('2026-10-05T00:00:00.000Z'),
      ambito: 'ESCOLAR',
      tipoEscolar: 'TRABAJO',
      asignaturaHorarioId: 'ah-mates',
      usuarioId: 'hija',
      etiquetas: { connectOrCreate: { where: { usuarioId_nombre: { usuarioId: 'hija', nombre: 'Matemáticas 4ºB' } } } },
      trabajoClassroom: { create: { usuarioId: 'hija', cursoId: 'c1', trabajoId: 't1' } },
    });
  });

  it('al volver a importar no duplica: actualiza si cambió la fecha y respeta las borradas o hechas', async () => {
    api.courses.courseWork.list.mockResolvedValue({
      data: { courseWork: [trabajo('t1', 'Ficha de fracciones', 7), trabajo('t4', 'Borrada', 8), trabajo('t5', 'Hecha', 9)] },
    });
    prismaFalso.trabajoClassroom.findMany.mockResolvedValue([
      { trabajoId: 't1', tareaId: 'tarea-1', tarea: { estado: 'POR_HACER', titulo: 'Ficha de fracciones', fechaLimite: new Date('2026-10-05T00:00:00.000Z') } },
      { trabajoId: 't4', tareaId: null, tarea: null },
      { trabajoId: 't5', tareaId: 'tarea-5', tarea: { estado: 'HECHA', titulo: 'Hecha', fechaLimite: null } },
    ]);

    const resumen = await servicio.importar('hija', AHORA);

    expect(resumen).toEqual({ cursos: 1, nuevas: 0, actualizadas: 1 });
    expect(prismaFalso.tarea.create).not.toHaveBeenCalled();
    expect(prismaFalso.tarea.update).toHaveBeenCalledWith({
      where: { id: 'tarea-1' },
      data: { titulo: 'Ficha de fracciones', fechaLimite: new Date('2026-10-07T00:00:00.000Z') },
    });
  });

  it('sin los permisos de Classroom pide conectarlo, sin llamar a Google', async () => {
    prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({ googleRefreshToken: 'r', googleAmbitos: 'https://www.googleapis.com/auth/calendar.events' });

    await expect(servicio.importar('hija', AHORA)).rejects.toThrow(BadRequestException);
    expect(api.courses.list).not.toHaveBeenCalled();
  });

  it('explica si la API no está activada o si el centro no lo permite', async () => {
    api.courses.list.mockRejectedValueOnce(Object.assign(new Error('Google Classroom API has not been used in project 123'), { status: 403 }));
    await expect(servicio.importar('hija', AHORA)).rejects.toThrow(ServiceUnavailableException);

    api.courses.list.mockRejectedValueOnce(Object.assign(new Error('The caller does not have permission'), { status: 403 }));
    await expect(servicio.importar('hija', AHORA)).rejects.toThrow(ForbiddenException);
  });
});
