import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IaService } from '../ia/ia.service.js';
import { PlanesService } from '../planes/planes.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { AsistenteService, diasParaEstudiar, limpiarPasos, limpiarPlan } from './asistente.service.js';

// 29/09/2026 a las 12:00 en Madrid.
const AHORA = new Date('2026-09-29T10:00:00Z');

function tarea(datos: Record<string, unknown> = {}) {
  return {
    id: 'examen',
    titulo: 'Examen de fracciones',
    descripcion: 'Temas 3 y 4',
    fechaLimite: new Date('2026-10-02T00:00:00Z'),
    subtareas: [{ titulo: 'Hacer la ficha 1' }],
    asignaturaHorario: { asignatura: { nombre: 'Matemáticas' } },
    usuario: { idioma: 'va' },
    ...datos,
  };
}

describe('limpieza de las propuestas de la IA', () => {
  it('pasos: quita numeración, vacíos, repetidos y los que ya son subtareas; como mucho 8', () => {
    const respuesta = {
      pasos: ['1. Leer el tema 3', '- Leer el tema 3', '', 'Hacer la ficha 1', 42, ...Array.from({ length: 10 }, (_, i) => `Paso ${i}`)],
    };

    const pasos = limpiarPasos(respuesta, ['Hacer la ficha 1']);

    expect(pasos[0]).toBe('Leer el tema 3');
    expect(pasos).not.toContain('Hacer la ficha 1');
    expect(pasos).toHaveLength(8);
    expect(limpiarPasos({ otra: 'cosa' }, [])).toEqual([]);
  });

  it('plan: solo días permitidos, 2 sesiones por día como mucho, minutos entre 15 y 120, en orden', () => {
    const plan = limpiarPlan(
      {
        sesiones: [
          { fecha: '2026-10-01', titulo: 'Repasar', minutos: 500 },
          { fecha: '2026-09-29', titulo: 'Leer el tema 3', minutos: 5 },
          { fecha: '2026-09-29', titulo: 'Hacer ejercicios', minutos: 30 },
          { fecha: '2026-09-29', titulo: 'Tercera del mismo día', minutos: 30 },
          { fecha: '2026-10-02', titulo: 'El día del examen no', minutos: 30 },
          { fecha: '2026-09-30', titulo: '', minutos: 30 },
          { fecha: '2026-09-30', titulo: 'Sin minutos' },
        ],
      },
      ['2026-09-29', '2026-09-30', '2026-10-01'],
    );

    expect(plan).toEqual([
      { fecha: '2026-09-29', titulo: 'Leer el tema 3', minutos: 15 },
      { fecha: '2026-09-29', titulo: 'Hacer ejercicios', minutos: 30 },
      { fecha: '2026-09-30', titulo: 'Sin minutos', minutos: 30 },
      { fecha: '2026-10-01', titulo: 'Repasar', minutos: 120 },
    ]);
  });

  it('días para estudiar: de hoy a la víspera, como mucho los 14 últimos', () => {
    expect(diasParaEstudiar('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
    expect(diasParaEstudiar('2026-09-29', '2026-09-29')).toEqual([]);
    const largo = diasParaEstudiar('2026-09-01', '2026-12-01');
    expect(largo).toHaveLength(14);
    expect(largo.at(-1)).toBe('2026-11-30');
  });
});

describe('AsistenteService', () => {
  let servicio: AsistenteService;
  const prismaFalso = { tarea: { findFirst: vi.fn() } };
  const iaFalsa = { disponible: vi.fn(), generarJson: vi.fn() };
  const planesFalso = { comprobarUsoIa: vi.fn(), registrarUsoIa: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaFalso.tarea.findFirst.mockResolvedValue(tarea());
    iaFalsa.disponible.mockResolvedValue(true);
    planesFalso.comprobarUsoIa.mockResolvedValue(undefined);
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AsistenteService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: IaService, useValue: iaFalsa },
        { provide: PlanesService, useValue: planesFalso },
        { provide: ConfigService, useValue: { get: () => 'Europe/Madrid' } },
      ],
    }).compile();
    servicio = modulo.get(AsistenteService);
  });

  it('solo trabaja con tareas del propio usuario', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValue(null);

    await expect(servicio.proponerSubtareas('otra', 'examen')).rejects.toThrow(NotFoundException);
    expect(prismaFalso.tarea.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'examen', usuarioId: 'otra' } }),
    );
  });

  it('propone subtareas en el idioma del usuario, sin repetir las que ya tiene', async () => {
    iaFalsa.generarJson.mockResolvedValue({ pasos: ['Llegir el tema 3', 'Hacer la ficha 1'] });

    expect(await servicio.proponerSubtareas('hija', 'examen')).toEqual({ pasos: ['Llegir el tema 3'] });
    const instrucciones = iaFalsa.generarJson.mock.calls[0][0] as string;
    expect(instrucciones).toContain('Escribe en valenciano');
    expect(instrucciones).toContain('Examen de fracciones');
    expect(instrucciones).toContain('Hacer la ficha 1');
    expect(planesFalso.registrarUsoIa).toHaveBeenCalledWith('hija', 'SUBTAREAS');
  });

  it('sin la IA en su plan no llega a preguntar a la IA ni gasta usos', async () => {
    planesFalso.comprobarUsoIa.mockRejectedValue(new ForbiddenException('La ayuda de la IA está incluida en el plan Plus'));

    await expect(servicio.proponerSubtareas('laura', 'examen')).rejects.toThrow(ForbiddenException);
    await expect(servicio.proponerPlanEstudio('laura', 'examen', AHORA)).rejects.toThrow(ForbiddenException);
    expect(iaFalsa.disponible).not.toHaveBeenCalled();
    expect(iaFalsa.generarJson).not.toHaveBeenCalled();
    expect(planesFalso.registrarUsoIa).not.toHaveBeenCalled();
  });

  it('avisa si la IA no está o si su respuesta no sirve (y entonces no gasta usos)', async () => {
    iaFalsa.disponible.mockResolvedValueOnce(false);
    await expect(servicio.proponerSubtareas('hija', 'examen')).rejects.toThrow(ServiceUnavailableException);

    iaFalsa.generarJson.mockResolvedValueOnce(null);
    await expect(servicio.proponerSubtareas('hija', 'examen')).rejects.toThrow(BadGatewayException);
    expect(planesFalso.registrarUsoIa).not.toHaveBeenCalled();
  });

  it('el plan de estudio solo ofrece los días que quedan hasta el examen', async () => {
    iaFalsa.generarJson.mockResolvedValue({
      sesiones: [
        { fecha: '2026-09-30', titulo: 'Repassar el tema 3', minutos: 40 },
        { fecha: '2026-10-05', titulo: 'Fora de termini', minutos: 40 },
      ],
    });

    const { sesiones } = await servicio.proponerPlanEstudio('hija', 'examen', AHORA);

    expect(sesiones).toEqual([{ fecha: '2026-09-30', titulo: 'Repassar el tema 3', minutos: 40 }]);
    const instrucciones = iaFalsa.generarJson.mock.calls[0][0] as string;
    expect(instrucciones).toContain('2026-09-29 (martes), 2026-09-30 (miércoles), 2026-10-01 (jueves)');
    expect(planesFalso.registrarUsoIa).toHaveBeenCalledWith('hija', 'PLAN_ESTUDIO');
  });

  it('sin fecha límite o sin días por delante no se puede planificar (ni se llama a la IA)', async () => {
    prismaFalso.tarea.findFirst.mockResolvedValueOnce(tarea({ fechaLimite: null }));
    await expect(servicio.proponerPlanEstudio('hija', 'examen', AHORA)).rejects.toThrow(BadRequestException);

    prismaFalso.tarea.findFirst.mockResolvedValueOnce(tarea({ fechaLimite: new Date('2026-09-29T00:00:00Z') }));
    await expect(servicio.proponerPlanEstudio('hija', 'examen', AHORA)).rejects.toThrow(BadRequestException);

    expect(iaFalsa.disponible).not.toHaveBeenCalled();
  });
});
