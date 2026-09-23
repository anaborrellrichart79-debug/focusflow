import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import {
  FRANJAS_POR_DEFECTO,
  HorariosService,
  PALETA_ASIGNATURAS,
} from './horarios.service.js';

function horarioCompleto(datos: Record<string, unknown> = {}) {
  return {
    id: 'horario-1',
    usuarioId: 'usuario-1',
    cursoId: 'primaria-3',
    activo: true,
    franjas: [
      {
        id: 'franja-clase',
        tipo: 'CLASE',
        horaInicio: '09:00',
        horaFin: '10:00',
      },
      {
        id: 'franja-recreo',
        tipo: 'DESCANSO',
        horaInicio: '10:00',
        horaFin: '10:30',
      },
    ],
    asignaturas: [
      {
        id: 'ah-mates',
        asignaturaId: 'primaria-3-matematicas',
        color: PALETA_ASIGNATURAS[0],
      },
    ],
    sesiones: [],
    ...datos,
  };
}

describe('HorariosService', () => {
  let servicio: HorariosService;
  const tx = {
    horario: { updateMany: vi.fn(), update: vi.fn() },
    franjaHorario: { deleteMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    sesionClase: { deleteMany: vi.fn() },
  };
  const prismaFalso = {
    curso: { findUnique: vi.fn() },
    horario: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    asignatura: { findFirst: vi.fn() },
    asignaturaHorario: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sesionClase: { upsert: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(
      async (callback: (cliente: typeof tx) => Promise<unknown>) =>
        callback(tx),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.curso.findUnique.mockResolvedValue({ id: 'primaria-3' });
    prismaFalso.horario.findFirst.mockResolvedValue(horarioCompleto());

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        HorariosService,
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();

    servicio = modulo.get(HorariosService);
  });

  describe('crear', () => {
    it('el primer horario queda activo y nace con la plantilla hasta las 14:00', async () => {
      prismaFalso.horario.findFirst.mockResolvedValue(null);

      await servicio.crear('usuario-1', {
        titulo: '3º B',
        periodo: '26/27',
        cursoId: 'primaria-3',
        comunidad: 'COMUNITAT_VALENCIANA',
      });

      const { data } = prismaFalso.horario.create.mock.calls[0][0];
      expect(data).toMatchObject({
        titulo: '3º B',
        periodo: '26/27',
        activo: true,
        usuarioId: 'usuario-1',
      });
      expect(data.franjas.create).toHaveLength(FRANJAS_POR_DEFECTO.length);
      expect(data.franjas.create.at(-1)).toMatchObject({ horaFin: '14:00' });
      expect(
        data.franjas.create.filter(
          (franja: { tipo: string }) => franja.tipo === 'DESCANSO',
        ),
      ).toHaveLength(1);
    });

    it('si ya hay uno activo, el nuevo no le quita el sitio', async () => {
      await servicio.crear('usuario-1', {
        titulo: '4º A',
        periodo: '27/28',
        cursoId: 'primaria-3',
        comunidad: 'MADRID',
      });

      expect(prismaFalso.horario.create.mock.calls[0][0].data.activo).toBe(
        false,
      );
    });

    it('rechaza un curso que no existe', async () => {
      prismaFalso.curso.findUnique.mockResolvedValue(null);

      await expect(
        servicio.crear('usuario-1', {
          titulo: 'x',
          periodo: 'y',
          cursoId: 'no',
          comunidad: 'MADRID',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('no deja tocar el horario de otro usuario', async () => {
    prismaFalso.horario.findFirst.mockResolvedValue(null);

    await expect(
      servicio.actualizar('usuario-2', 'horario-1', { titulo: 'x' }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaFalso.horario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'horario-1', usuarioId: 'usuario-2' },
      }),
    );
  });

  it('activar un horario desactiva los demás del usuario', async () => {
    await servicio.actualizar('usuario-1', 'horario-1', { activo: true });

    expect(tx.horario.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: 'usuario-1', id: { not: 'horario-1' } },
      data: { activo: false },
    });
  });

  describe('reemplazarFranjas', () => {
    it('conserva las que traen id, borra las que faltan y crea las nuevas en orden', async () => {
      await servicio.reemplazarFranjas('usuario-1', 'horario-1', [
        {
          id: 'franja-clase',
          horaInicio: '08:00',
          horaFin: '09:00',
          tipo: 'CLASE',
        },
        {
          horaInicio: '09:00',
          horaFin: '09:30',
          tipo: 'DESCANSO',
          etiqueta: 'Recreo',
        },
      ]);

      expect(tx.franjaHorario.deleteMany).toHaveBeenCalledWith({
        where: { horarioId: 'horario-1', id: { notIn: ['franja-clase'] } },
      });
      expect(tx.franjaHorario.update).toHaveBeenCalledWith({
        where: { id: 'franja-clase' },
        data: {
          orden: 0,
          horaInicio: '08:00',
          horaFin: '09:00',
          tipo: 'CLASE',
          etiqueta: null,
        },
      });
      expect(tx.franjaHorario.create).toHaveBeenCalledWith({
        data: {
          orden: 1,
          horaInicio: '09:00',
          horaFin: '09:30',
          tipo: 'DESCANSO',
          etiqueta: 'Recreo',
          horarioId: 'horario-1',
        },
      });
    });

    it('admite dos recreos y jornada partida (comida y clases por la tarde)', async () => {
      await servicio.reemplazarFranjas('usuario-1', 'horario-1', [
        { horaInicio: '09:00', horaFin: '10:00', tipo: 'CLASE' },
        {
          horaInicio: '10:00',
          horaFin: '10:20',
          tipo: 'DESCANSO',
          etiqueta: 'Recreo',
        },
        { horaInicio: '10:20', horaFin: '12:00', tipo: 'CLASE' },
        {
          horaInicio: '12:00',
          horaFin: '12:20',
          tipo: 'DESCANSO',
          etiqueta: 'Recreo',
        },
        { horaInicio: '12:20', horaFin: '13:00', tipo: 'CLASE' },
        {
          horaInicio: '13:00',
          horaFin: '15:00',
          tipo: 'DESCANSO',
          etiqueta: 'Comida',
        },
        { horaInicio: '15:00', horaFin: '16:30', tipo: 'CLASE' },
      ]);

      expect(tx.franjaHorario.create).toHaveBeenCalledTimes(7);
    });

    it('rechaza una franja que termina antes de empezar', async () => {
      await expect(
        servicio.reemplazarFranjas('usuario-1', 'horario-1', [
          { horaInicio: '10:00', horaFin: '09:00', tipo: 'CLASE' },
        ]),
      ).rejects.toThrow(BadRequestException);
      expect(prismaFalso.$transaction).not.toHaveBeenCalled();
    });

    it('al pasar una franja a descanso le quita sus clases', async () => {
      await servicio.reemplazarFranjas('usuario-1', 'horario-1', [
        {
          id: 'franja-clase',
          horaInicio: '09:00',
          horaFin: '10:00',
          tipo: 'DESCANSO',
        },
      ]);

      expect(tx.sesionClase.deleteMany).toHaveBeenCalledWith({
        where: { franjaId: 'franja-clase' },
      });
    });

    it('rechaza ids de franjas de otro horario', async () => {
      await expect(
        servicio.reemplazarFranjas('usuario-1', 'horario-1', [
          {
            id: '00000000-0000-0000-0000-000000000000',
            horaInicio: '09:00',
            horaFin: '10:00',
            tipo: 'CLASE',
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('asignaturas del horario', () => {
    it('añadir una asigna el primer color libre de la paleta', async () => {
      prismaFalso.asignatura.findFirst.mockResolvedValue({
        id: 'primaria-3-lengua',
      });

      await servicio.anadirAsignatura('usuario-1', 'horario-1', {
        asignaturaId: 'primaria-3-lengua',
      });

      expect(prismaFalso.asignaturaHorario.create).toHaveBeenCalledWith({
        data: {
          horarioId: 'horario-1',
          asignaturaId: 'primaria-3-lengua',
          color: PALETA_ASIGNATURAS[1],
        },
      });
    });

    it('solo acepta asignaturas del curso del horario (oficiales o propias)', async () => {
      prismaFalso.asignatura.findFirst.mockResolvedValue(null);

      await expect(
        servicio.anadirAsignatura('usuario-1', 'horario-1', {
          asignaturaId: 'eso-1-musica',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaFalso.asignatura.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'eso-1-musica',
          cursoId: 'primaria-3',
          OR: [{ usuarioId: null }, { usuarioId: 'usuario-1' }],
        },
      });
    });

    it('no deja añadir dos veces la misma', async () => {
      prismaFalso.asignatura.findFirst.mockResolvedValue({
        id: 'primaria-3-matematicas',
      });

      await expect(
        servicio.anadirAsignatura('usuario-1', 'horario-1', {
          asignaturaId: 'primaria-3-matematicas',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('asignarSesion', () => {
    it('pone una asignatura en una celda', async () => {
      await servicio.asignarSesion('usuario-1', 'horario-1', {
        franjaId: 'franja-clase',
        diaSemana: 1,
        asignaturaHorarioId: 'ah-mates',
        aula: ' 12 ',
      });

      expect(prismaFalso.sesionClase.upsert).toHaveBeenCalledWith({
        where: {
          franjaId_diaSemana: { franjaId: 'franja-clase', diaSemana: 1 },
        },
        create: {
          horarioId: 'horario-1',
          franjaId: 'franja-clase',
          diaSemana: 1,
          asignaturaHorarioId: 'ah-mates',
          aula: '12',
        },
        update: { asignaturaHorarioId: 'ah-mates', aula: '12' },
      });
    });

    it('con null vacía la celda', async () => {
      await servicio.asignarSesion('usuario-1', 'horario-1', {
        franjaId: 'franja-clase',
        diaSemana: 3,
        asignaturaHorarioId: null,
      });

      expect(prismaFalso.sesionClase.deleteMany).toHaveBeenCalledWith({
        where: { franjaId: 'franja-clase', diaSemana: 3 },
      });
      expect(prismaFalso.sesionClase.upsert).not.toHaveBeenCalled();
    });

    it('no deja poner clases en un descanso', async () => {
      await expect(
        servicio.asignarSesion('usuario-1', 'horario-1', {
          franjaId: 'franja-recreo',
          diaSemana: 1,
          asignaturaHorarioId: 'ah-mates',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza una asignatura que no está en el horario', async () => {
      await expect(
        servicio.asignarSesion('usuario-1', 'horario-1', {
          franjaId: 'franja-clase',
          diaSemana: 1,
          asignaturaHorarioId: 'ah-de-otro-horario',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
