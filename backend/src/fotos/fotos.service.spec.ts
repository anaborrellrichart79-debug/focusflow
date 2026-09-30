import { BadGatewayException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogoService } from '../horarios/catalogo.service.js';
import { HorariosService } from '../horarios/horarios.service.js';
import { IaService } from '../ia/ia.service.js';
import { PlanesService } from '../planes/planes.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { FotosService, limpiarDeberes, limpiarEntregas, limpiarHorario } from './fotos.service.js';

// 30/09/2026 a las 12:00 en Madrid.
const AHORA = new Date('2026-09-30T10:00:00Z');
const FOTO = { datos: Buffer.from('foto'), tipo: 'image/jpeg' as const };

describe('limpieza de lo que lee la IA en la foto', () => {
  const asignaturas = new Map([
    ['Matemáticas', 'id-mates'],
    ['Valenciano: Lengua y Literatura', 'id-valenciano'],
  ]);

  it('horario: horas normalizadas y en orden, sin repetidas, sin clases en el recreo y solo asignaturas conocidas', () => {
    const franjas = limpiarHorario(
      {
        franjas: [
          { horaInicio: '10:00', horaFin: '10:30', tipo: 'DESCANSO', etiqueta: 'Patio', clases: [{ diaSemana: 1, asignatura: 'Matemáticas' }] },
          {
            horaInicio: '9:00',
            horaFin: '10.00',
            tipo: 'CLASE',
            etiqueta: 'no se usa',
            clases: [
              { diaSemana: 3, asignatura: 'Valenciano: Lengua y Literatura' },
              { diaSemana: 1, asignatura: 'Matemáticas' },
              { diaSemana: 1, asignatura: 'Valenciano: Lengua y Literatura' },
              { diaSemana: 6, asignatura: 'Matemáticas' },
              { diaSemana: 2, asignatura: 'Química cuántica' },
            ],
          },
          { horaInicio: '09:00', horaFin: '09:45', tipo: 'CLASE', etiqueta: '', clases: [] },
          { horaInicio: '12:00', horaFin: '11:00', tipo: 'CLASE', etiqueta: '', clases: [] },
          { horaInicio: 'mediodía', horaFin: '13:00', tipo: 'CLASE', etiqueta: '', clases: [] },
        ],
      },
      asignaturas,
    );

    expect(franjas).toEqual([
      {
        horaInicio: '09:00',
        horaFin: '10:00',
        tipo: 'CLASE',
        etiqueta: '',
        clases: [
          { diaSemana: 1, asignaturaId: 'id-mates', nombre: 'Matemáticas' },
          { diaSemana: 3, asignaturaId: 'id-valenciano', nombre: 'Valenciano: Lengua y Literatura' },
        ],
      },
      { horaInicio: '10:00', horaFin: '10:30', tipo: 'DESCANSO', etiqueta: 'Patio', clases: [] },
    ]);
    expect(limpiarHorario({ otra: 'cosa' }, asignaturas)).toEqual([]);
  });

  it('entregas: solo fechas reales de hoy en adelante, sin repetidas, en orden y con su asignatura', () => {
    const entregas = limpiarEntregas(
      {
        entregas: [
          { fecha: '2026-10-20', titulo: 'Examen de Valencià', tipo: 'EXAMEN', asignatura: 'Valenciano: Lengua y Literatura' },
          { fecha: '2026-10-06', titulo: ' Examen de las tablas ', tipo: 'EXAMEN', asignatura: 'Matemáticas' },
          { fecha: '2026-10-06', titulo: 'Examen de las tablas', tipo: 'EXAMEN', asignatura: 'Matemáticas' },
          { fecha: '2026-09-15', titulo: 'Ya pasó', tipo: 'EXAMEN', asignatura: '' },
          { fecha: '2026-02-30', titulo: 'Fecha imposible', tipo: 'TRABAJO', asignatura: '' },
          { fecha: '2026-13-01', titulo: 'Mes imposible', tipo: 'TRABAJO', asignatura: '' },
          { fecha: '2026-11-03', titulo: '', tipo: 'TRABAJO', asignatura: '' },
          { fecha: '2026-11-10', titulo: 'Mural de otoño', tipo: 'OTRO', asignatura: 'Plástica' },
        ],
      },
      asignaturas,
      '2026-09-30',
    );

    expect(entregas).toEqual([
      { fecha: '2026-10-06', titulo: 'Examen de las tablas', tipo: 'EXAMEN', asignaturaHorarioId: 'id-mates' },
      { fecha: '2026-10-20', titulo: 'Examen de Valencià', tipo: 'EXAMEN', asignaturaHorarioId: 'id-valenciano' },
      { fecha: '2026-11-10', titulo: 'Mural de otoño', tipo: 'EXAMEN', asignaturaHorarioId: null },
    ]);
  });
});

describe('limpieza de los deberes leídos de la agenda', () => {
  it('con texto, sin repetidos; la fecha solo si es real y no ha pasado (si no, null)', () => {
    const deberes = limpiarDeberes(
      {
        deberes: [
          { asignatura: 'Matemáticas', titulo: ' Página 34, ejercicios 1 a 5 ', fecha: '' },
          { asignatura: 'Matemáticas', titulo: 'Página 34, ejercicios 1 a 5', fecha: '' },
          { asignatura: 'Valenciano', titulo: 'Llegir el conte', fecha: '2026-10-02' },
          { asignatura: '', titulo: 'Traer la autorización firmada', fecha: '2026-09-20' },
          { asignatura: 'Matemáticas', titulo: 'Ficha de repaso', fecha: '2026-02-30' },
          { asignatura: 'Matemáticas', titulo: '   ', fecha: '' },
        ],
      },
      new Map([
        ['Matemáticas', 'ah-mates'],
        ['Valenciano', 'ah-valenciano'],
      ]),
      '2026-09-30',
    );

    expect(deberes).toEqual([
      { titulo: 'Página 34, ejercicios 1 a 5', fecha: null, asignaturaHorarioId: 'ah-mates' },
      { titulo: 'Llegir el conte', fecha: '2026-10-02', asignaturaHorarioId: 'ah-valenciano' },
      { titulo: 'Traer la autorización firmada', fecha: null, asignaturaHorarioId: null },
      { titulo: 'Ficha de repaso', fecha: null, asignaturaHorarioId: 'ah-mates' },
    ]);
  });
});

describe('FotosService', () => {
  let servicio: FotosService;
  const iaFalsa = { leerImagenJson: vi.fn(), leeImagenes: vi.fn() };
  const planesFalso = { comprobarUsoIa: vi.fn(), registrarUsoIa: vi.fn() };
  const horariosFalso = { obtenerCompleto: vi.fn(), obtenerActivo: vi.fn() };
  const catalogoFalso = { listarAsignaturas: vi.fn() };
  const prismaFalso = { usuario: { findUnique: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();
    iaFalsa.leeImagenes.mockReturnValue(true);
    planesFalso.comprobarUsoIa.mockResolvedValue(undefined);
    prismaFalso.usuario.findUnique.mockResolvedValue({ idioma: 'va' });
    horariosFalso.obtenerCompleto.mockResolvedValue({
      cursoId: 'primaria-4',
      comunidad: 'COMUNITAT_VALENCIANA',
      curso: { nombre: '4.º de Primaria' },
      asignaturas: [{ asignaturaId: 'primaria-4-matematicas' }],
    });
    catalogoFalso.listarAsignaturas.mockResolvedValue([
      { id: 'primaria-4-matematicas', nombre: 'Matemáticas' },
      { id: 'primaria-4-valenciano', nombre: 'Valenciano: Lengua y Literatura' },
    ]);
    horariosFalso.obtenerActivo.mockResolvedValue({
      asignaturas: [{ id: 'ah-mates', asignatura: { nombre: 'Matemáticas' } }],
    });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        FotosService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: IaService, useValue: iaFalsa },
        { provide: PlanesService, useValue: planesFalso },
        { provide: HorariosService, useValue: horariosFalso },
        { provide: CatalogoService, useValue: catalogoFalso },
        { provide: ConfigService, useValue: { get: () => 'Europe/Madrid' } },
      ],
    }).compile();
    servicio = modulo.get(FotosService);
  });

  it('horario: manda la foto con el listado de asignaturas del curso y devuelve la propuesta (y gasta un uso)', async () => {
    iaFalsa.leerImagenJson.mockResolvedValue({
      franjas: [
        { horaInicio: '09:00', horaFin: '10:00', tipo: 'CLASE', etiqueta: '', clases: [{ diaSemana: 1, asignatura: 'Matemáticas' }] },
      ],
    });

    const { franjas } = await servicio.proponerHorario('sofia', 'horario-1', FOTO);

    expect(franjas[0].clases).toEqual([{ diaSemana: 1, asignaturaId: 'primaria-4-matematicas', nombre: 'Matemáticas' }]);
    const [instrucciones, esquema, imagen] = iaFalsa.leerImagenJson.mock.calls[0];
    expect(instrucciones).toContain('4.º de Primaria');
    expect(instrucciones).toContain('valenciano');
    expect(JSON.stringify(esquema)).toContain('Valenciano: Lengua y Literatura');
    expect(imagen).toBe(FOTO);
    expect(catalogoFalso.listarAsignaturas).toHaveBeenCalledWith('sofia', 'primaria-4', 'COMUNITAT_VALENCIANA');
    expect(planesFalso.registrarUsoIa).toHaveBeenCalledWith('sofia', 'FOTO_HORARIO');
  });

  it('exámenes: le da la fecha de hoy y el curso escolar, y usa las asignaturas del horario activo', async () => {
    iaFalsa.leerImagenJson.mockResolvedValue({
      entregas: [{ fecha: '2026-10-06', titulo: 'Examen de las tablas', tipo: 'EXAMEN', asignatura: 'Matemáticas' }],
    });

    const { entregas } = await servicio.proponerEntregas('sofia', FOTO, AHORA);

    expect(entregas).toEqual([
      { fecha: '2026-10-06', titulo: 'Examen de las tablas', tipo: 'EXAMEN', asignaturaHorarioId: 'ah-mates' },
    ]);
    const instrucciones = iaFalsa.leerImagenJson.mock.calls[0][0] as string;
    expect(instrucciones).toContain('Hoy es 2026-09-30');
    expect(instrucciones).toContain('curso escolar 2026-2027');
    expect(planesFalso.registrarUsoIa).toHaveBeenCalledWith('sofia', 'FOTO_EXAMENES');
  });

  it('deberes: le dice qué día es hoy, usa las asignaturas del horario y gasta un uso', async () => {
    iaFalsa.leerImagenJson.mockResolvedValue({
      deberes: [{ asignatura: 'Matemáticas', titulo: 'Pàgina 34, exercicis 1 a 5', fecha: '' }],
    });

    const { deberes } = await servicio.proponerDeberes('sofia', FOTO, AHORA);

    expect(deberes).toEqual([{ titulo: 'Pàgina 34, exercicis 1 a 5', fecha: null, asignaturaHorarioId: 'ah-mates' }]);
    const instrucciones = iaFalsa.leerImagenJson.mock.calls[0][0] as string;
    expect(instrucciones).toContain('Hoy es miércoles 2026-09-30');
    expect(instrucciones).toContain('valenciano');
    expect(planesFalso.registrarUsoIa).toHaveBeenCalledWith('sofia', 'FOTO_DEBERES');
  });

  it('sin la IA en su plan no se envía la foto', async () => {
    planesFalso.comprobarUsoIa.mockRejectedValue(new ForbiddenException('La ayuda de la IA está incluida en el plan Plus'));

    await expect(servicio.proponerEntregas('laura', FOTO, AHORA)).rejects.toThrow(ForbiddenException);
    expect(iaFalsa.leerImagenJson).not.toHaveBeenCalled();
  });

  it('sin Anthropic (solo Ollama, que no ve imágenes) avisa de que la IA no está disponible', async () => {
    iaFalsa.leeImagenes.mockReturnValue(false);

    await expect(servicio.proponerHorario('sofia', 'horario-1', FOTO)).rejects.toThrow(ServiceUnavailableException);
  });

  it('si la foto no sirve (nada que leer), lo dice y no gasta usos', async () => {
    iaFalsa.leerImagenJson.mockResolvedValue({ entregas: [] });

    await expect(servicio.proponerEntregas('sofia', FOTO, AHORA)).rejects.toThrow(BadGatewayException);
    expect(planesFalso.registrarUsoIa).not.toHaveBeenCalled();
  });
});
