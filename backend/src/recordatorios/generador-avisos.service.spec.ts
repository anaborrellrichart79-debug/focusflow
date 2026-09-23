import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CorreoService } from '../correo/correo.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';
import { GeneradorAvisosService } from './generador-avisos.service.js';
import { IaService } from './ia.service.js';

// Miércoles 23/09/2026 a las 12:00 en Madrid (10:00 UTC, horario de verano).
const AHORA = new Date('2026-09-23T10:00:00.000Z');
const HACE_UN_DIA = new Date('2026-09-22T10:00:00.000Z');

function recordatorio(datos: Record<string, unknown>) {
  return {
    id: 'rec-1',
    activo: true,
    diaSemana: null,
    hora: null,
    horasAntes: null,
    diasAntes: null,
    soloEscolar: false,
    porCorreo: false,
    ...datos,
  };
}

function tarea(datos: Record<string, unknown>) {
  return {
    id: 'tarea-1',
    titulo: 'Trabajo de historia',
    fechaLimite: null,
    ambito: 'PERSONAL',
    actualizadoEn: HACE_UN_DIA,
    ...datos,
  };
}

describe('GeneradorAvisosService', () => {
  let servicio: GeneradorAvisosService;

  const usuarioBase = {
    correo: 'ana@example.com',
    emergenciaActiva: false,
    emergenciaDias: 3,
    emergenciaPorCorreo: false,
    recordatorios: [] as ReturnType<typeof recordatorio>[],
  };
  const prismaFalso = {
    usuario: { findMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    tarea: { findMany: vi.fn() },
    aviso: {
      findMany: vi.fn(),
      createManyAndReturn: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  const calendarioFalso = { periodosDelUsuario: vi.fn() };
  const iaFalsa = { redactar: vi.fn() };
  const correoFalso = { estaConfigurado: vi.fn(), enviarAviso: vi.fn() };
  const configFalso = {
    get: vi.fn((clave: string) =>
      clave === 'ZONA_HORARIA' ? 'Europe/Madrid' : undefined,
    ),
  };

  function usuarioCon(datos: Partial<typeof usuarioBase>) {
    prismaFalso.usuario.findUniqueOrThrow.mockResolvedValue({
      ...usuarioBase,
      ...datos,
    });
  }

  function avisosCreados() {
    return prismaFalso.aviso.createManyAndReturn.mock.calls[0]?.[0].data ?? [];
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    usuarioCon({});
    prismaFalso.tarea.findMany.mockResolvedValue([]);
    prismaFalso.aviso.findMany.mockResolvedValue([]);
    prismaFalso.aviso.createManyAndReturn.mockImplementation(
      async ({ data }: { data: Record<string, unknown>[] }) =>
        data.map((aviso, indice) => ({ id: `aviso-${indice}`, ...aviso })),
    );
    calendarioFalso.periodosDelUsuario.mockResolvedValue([]);
    iaFalsa.redactar.mockResolvedValue(null);
    correoFalso.estaConfigurado.mockReturnValue(true);
    correoFalso.enviarAviso.mockResolvedValue(undefined);

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        GeneradorAvisosService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: CalendarioEscolarService, useValue: calendarioFalso },
        { provide: IaService, useValue: iaFalsa },
        { provide: CorreoService, useValue: correoFalso },
        { provide: ConfigService, useValue: configFalso },
      ],
    }).compile();

    servicio = modulo.get(GeneradorAvisosService);
  });

  describe('revisión semanal', () => {
    it('avisa el día y a partir de la hora configurados, con el resumen de tareas', async () => {
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '11:30',
          }),
        ],
      });
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({
          id: 't-vencida',
          titulo: 'Vencida',
          fechaLimite: new Date('2026-09-20T00:00:00.000Z'),
        }),
        tarea({
          id: 't-pronto',
          titulo: 'Pronto',
          fechaLimite: new Date('2026-09-25T00:00:00.000Z'),
        }),
        tarea({ id: 't-sin-fecha' }),
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(1);
      expect(avisosCreados()[0]).toMatchObject({
        tipo: 'REVISION_SEMANAL',
        clave: 'revision:rec-1:2026-09-23',
        datos: {
          pendientes: 3,
          vencidas: 1,
          proximos7Dias: 1,
          titulos: ['Vencida', 'Pronto'],
        },
      });
    });

    it('no avisa antes de la hora (la hora se compara en la zona del usuario, no en UTC)', async () => {
      // Son las 12:00 en Madrid, aunque en UTC sean las 10:00.
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '12:05',
          }),
        ],
      });

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });

    it('no avisa otro día de la semana', async () => {
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 0,
            hora: '09:00',
          }),
        ],
      });

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });

    it('usa el texto de Ollama cuando responde', async () => {
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '09:00',
          }),
        ],
      });
      iaFalsa.redactar.mockResolvedValue('Empieza por el examen de mates.');

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(prismaFalso.aviso.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['aviso-0'] } },
        data: { mensajeIa: 'Empieza por el examen de mates.' },
      });
    });

    it('si Ollama falla, el aviso se crea igual sin texto de IA', async () => {
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '09:00',
          }),
        ],
      });
      iaFalsa.redactar.mockResolvedValue(null);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(1);
      expect(prismaFalso.aviso.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('entregas', () => {
    it('avisa de una tarea con hora que vence dentro del margen', async () => {
      usuarioCon({
        recordatorios: [recordatorio({ tipo: 'ENTREGA', horasAntes: 24 })],
      });
      // Mañana a las 09:00 (hora de reloj): faltan 21 horas.
      const fechaLimite = new Date('2026-09-24T09:00:00.000Z');
      prismaFalso.tarea.findMany.mockResolvedValue([tarea({ fechaLimite })]);

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(avisosCreados()[0]).toMatchObject({
        tipo: 'ENTREGA',
        tareaId: 'tarea-1',
        clave: `entrega:rec-1:tarea-1:${fechaLimite.toISOString()}`,
        datos: { horasRestantes: 21 },
      });
    });

    it('una tarea sin hora vence al final de su día', async () => {
      usuarioCon({
        recordatorios: [recordatorio({ tipo: 'ENTREGA', horasAntes: 12 })],
      });
      // Hoy sin hora: vence a las 23:59, faltan menos de 12 horas.
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({ fechaLimite: new Date('2026-09-23T00:00:00.000Z') }),
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(1);
    });

    it('no avisa si falta más que el margen o si ya ha vencido', async () => {
      usuarioCon({
        recordatorios: [recordatorio({ tipo: 'ENTREGA', horasAntes: 2 })],
      });
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({
          id: 'lejos',
          fechaLimite: new Date('2026-09-24T09:00:00.000Z'),
        }),
        tarea({
          id: 'vencida',
          fechaLimite: new Date('2026-09-23T08:00:00.000Z'),
        }),
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });

    it('con "solo escolar" ignora las tareas personales', async () => {
      usuarioCon({
        recordatorios: [
          recordatorio({ tipo: 'ENTREGA', horasAntes: 48, soloEscolar: true }),
        ],
      });
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({
          id: 'personal',
          fechaLimite: new Date('2026-09-24T09:00:00.000Z'),
        }),
        tarea({
          id: 'escolar',
          ambito: 'ESCOLAR',
          fechaLimite: new Date('2026-09-24T09:00:00.000Z'),
        }),
      ]);

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(
        avisosCreados().map((aviso: { tareaId: string }) => aviso.tareaId),
      ).toEqual(['escolar']);
    });
  });

  describe('vacaciones', () => {
    it('avisa desde "diasAntes" días antes del periodo, contando las tareas que vencen antes', async () => {
      usuarioCon({
        recordatorios: [recordatorio({ tipo: 'VACACIONES', diasAntes: 3 })],
      });
      calendarioFalso.periodosDelUsuario.mockResolvedValue([
        {
          clave: 'puente',
          nombre: 'Puente',
          inicio: '2026-09-25',
          fin: '2026-09-28',
        },
        {
          clave: 'navidad',
          nombre: 'Navidad',
          inicio: '2026-12-22',
          fin: '2027-01-06',
        },
      ]);
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({ fechaLimite: new Date('2026-09-24T00:00:00.000Z') }),
      ]);

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(avisosCreados()).toHaveLength(1);
      expect(avisosCreados()[0]).toMatchObject({
        clave: 'vacaciones:rec-1:puente:2026-09-25',
        datos: { diasRestantes: 2, tareasAntes: 1 },
      });
    });

    it('no avisa de un periodo que ya ha empezado', async () => {
      usuarioCon({
        recordatorios: [recordatorio({ tipo: 'VACACIONES', diasAntes: 3 })],
      });
      calendarioFalso.periodosDelUsuario.mockResolvedValue([
        {
          clave: 'fiesta',
          nombre: 'Fiesta',
          inicio: '2026-09-21',
          fin: '2026-09-25',
        },
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });
  });

  describe('modo emergencia', () => {
    it('lanza una alarma por cada tarea pendiente sin tocar desde hace los días configurados', async () => {
      usuarioCon({ emergenciaActiva: true, emergenciaDias: 3 });
      const olvidada = new Date('2026-09-19T08:00:00.000Z');
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({ id: 'olvidada', actualizadoEn: olvidada }),
        tarea({ id: 'reciente' }),
      ]);
      iaFalsa.redactar.mockResolvedValue('¡Revisa hoy tus tareas olvidadas!');

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(avisosCreados()).toEqual([
        expect.objectContaining({
          tipo: 'EMERGENCIA',
          tareaId: 'olvidada',
          clave: `emergencia:olvidada:${olvidada.toISOString()}`,
          datos: { titulo: 'Trabajo de historia', diasSinTocar: 4 },
        }),
      ]);
      expect(prismaFalso.aviso.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['aviso-0'] } },
        data: { mensajeIa: '¡Revisa hoy tus tareas olvidadas!' },
      });
    });

    it('no salta con tareas "bajo control" o pospuestas: son decisiones, no olvidos', async () => {
      usuarioCon({ emergenciaActiva: true, emergenciaDias: 3 });
      const antigua = new Date('2026-09-01T00:00:00.000Z');
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({
          id: 'encarrilada',
          estado: 'BAJO_CONTROL',
          actualizadoEn: antigua,
        }),
        tarea({ id: 'aparcada', estado: 'POSPUESTA', actualizadoEn: antigua }),
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });

    it('desactivado no genera alarmas', async () => {
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({ actualizadoEn: new Date('2026-01-01T00:00:00.000Z') }),
      ]);

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    });
  });

  it('no repite un aviso que ya existe (misma clave) ni llama a Ollama para él', async () => {
    usuarioCon({
      recordatorios: [
        recordatorio({ tipo: 'REVISION_SEMANAL', diaSemana: 3, hora: '09:00' }),
      ],
    });
    prismaFalso.aviso.findMany.mockResolvedValue([
      { clave: 'revision:rec-1:2026-09-23' },
    ]);

    expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(0);
    expect(prismaFalso.aviso.createManyAndReturn).not.toHaveBeenCalled();
    expect(iaFalsa.redactar).not.toHaveBeenCalled();
  });

  it('con esperarIa: false responde sin esperar a Ollama y completa el texto después', async () => {
    usuarioCon({
      recordatorios: [
        recordatorio({ tipo: 'REVISION_SEMANAL', diaSemana: 3, hora: '09:00' }),
      ],
    });
    let responderIa: (texto: string) => void = () => {};
    iaFalsa.redactar.mockReturnValue(
      new Promise((resolver) => {
        responderIa = resolver;
      }),
    );

    expect(
      await servicio.procesarUsuario('usuario-1', AHORA, { esperarIa: false }),
    ).toBe(1);
    expect(prismaFalso.aviso.updateMany).not.toHaveBeenCalled();

    responderIa('Texto tardío');
    await vi.waitFor(() =>
      expect(prismaFalso.aviso.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['aviso-0'] } },
        data: { mensajeIa: 'Texto tardío' },
      }),
    );
  });

  describe('correo', () => {
    it('manda un solo correo con los avisos que lo tienen activado y lo marca como enviado', async () => {
      usuarioCon({
        emergenciaActiva: true,
        emergenciaPorCorreo: true,
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '09:00',
          }),
        ],
      });
      prismaFalso.tarea.findMany.mockResolvedValue([
        tarea({ id: 'a', actualizadoEn: new Date('2026-09-01T00:00:00.000Z') }),
        tarea({ id: 'b', actualizadoEn: new Date('2026-09-01T00:00:00.000Z') }),
      ]);

      await servicio.procesarUsuario('usuario-1', AHORA);

      expect(correoFalso.enviarAviso).toHaveBeenCalledTimes(1);
      const [destinatario, asunto, html] =
        correoFalso.enviarAviso.mock.calls[0];
      expect(destinatario).toBe('ana@example.com');
      expect(asunto).toContain('2 tareas llevan días sin revisar');
      // La revisión semanal no tenía el correo activado.
      expect(html).not.toContain('Revisión semanal');
      expect(prismaFalso.aviso.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['aviso-1', 'aviso-2'] } },
        data: { correoEnviadoEn: expect.any(Date) },
      });
    });

    it('sin SMTP configurado no intenta enviar', async () => {
      correoFalso.estaConfigurado.mockReturnValue(false);
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '09:00',
            porCorreo: true,
          }),
        ],
      });

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(1);
      expect(correoFalso.enviarAviso).not.toHaveBeenCalled();
    });

    it('si el correo falla, el aviso queda creado igualmente', async () => {
      correoFalso.enviarAviso.mockRejectedValue(new Error('SMTP caído'));
      usuarioCon({
        recordatorios: [
          recordatorio({
            tipo: 'REVISION_SEMANAL',
            diaSemana: 3,
            hora: '09:00',
            porCorreo: true,
          }),
        ],
      });

      expect(await servicio.procesarUsuario('usuario-1', AHORA)).toBe(1);
      expect(prismaFalso.aviso.updateMany).not.toHaveBeenCalled();
    });
  });

  it('procesarTodos sigue con los demás usuarios si uno falla', async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([
      { id: 'roto' },
      { id: 'bien' },
    ]);
    const procesar = vi
      .spyOn(servicio, 'procesarUsuario')
      .mockRejectedValueOnce(new Error('fallo'))
      .mockResolvedValueOnce(0);

    await servicio.procesarTodos(AHORA);

    expect(procesar).toHaveBeenCalledTimes(2);
    expect(prismaFalso.aviso.deleteMany).toHaveBeenCalled();
  });
});
