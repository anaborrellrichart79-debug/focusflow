import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { comoIdioma, NOMBRE_IDIOMA_PARA_IA } from '../comun/idiomas.js';
import type { TipoEscolar, TipoFranja } from '../generated/prisma/enums.js';
import { CatalogoService } from '../horarios/catalogo.service.js';
import { HorariosService } from '../horarios/horarios.service.js';
import { IaService, type TipoImagen } from '../ia/ia.service.js';
import { PlanesService } from '../planes/planes.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { obtenerHoraLocal } from '../recordatorios/hora-local.util.js';

const MAXIMO_FRANJAS = 20;
const MAXIMO_ENTREGAS = 40;
const TIPOS_ESCOLARES: TipoEscolar[] = ['EXAMEN', 'TRABAJO', 'PRESENTACION'];

type Imagen = { datos: Buffer; tipo: TipoImagen };

export interface ClasePropuesta {
  diaSemana: number;
  asignaturaId: string;
  nombre: string;
}

export interface FranjaPropuesta {
  horaInicio: string;
  horaFin: string;
  tipo: TipoFranja;
  etiqueta: string;
  clases: ClasePropuesta[];
}

export interface EntregaPropuesta {
  fecha: string;
  titulo: string;
  tipo: TipoEscolar;
  asignaturaHorarioId: string | null;
}

// Lee con la IA una foto del horario de clase o de un calendario de exámenes
// y devuelve una propuesta para revisar: no guarda nada (el horario se aplica
// después con HorariosService.aplicarPropuesta y las entregas se crean como
// tareas normales). Como el resto de la IA, solo con el plan Plus.
@Injectable()
export class FotosService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly ia: IaService,
    private readonly planes: PlanesService,
    private readonly horarios: HorariosService,
    private readonly catalogo: CatalogoService,
    private readonly config: ConfigService,
  ) {}

  async proponerHorario(usuarioId: string, horarioId: string, imagen: Imagen) {
    const horario = await this.horarios.obtenerCompleto(usuarioId, horarioId);
    await this.comprobarIa(usuarioId);

    const catalogo = await this.catalogo.listarAsignaturas(usuarioId, horario.cursoId, horario.comunidad);
    // Por nombre: las que ya están en el horario primero, para reutilizarlas.
    const yaElegidas = new Set(horario.asignaturas.map((elegida) => elegida.asignaturaId));
    const porNombre = new Map<string, string>();
    for (const asignatura of [...catalogo].sort((a, b) => Number(yaElegidas.has(b.id)) - Number(yaElegidas.has(a.id)))) {
      if (!porNombre.has(asignatura.nombre)) porNombre.set(asignatura.nombre, asignatura.id);
    }
    const nombres = [...porNombre.keys()];
    const idioma = NOMBRE_IDIOMA_PARA_IA[await this.idiomaDe(usuarioId)];

    const respuesta = await this.ia.leerImagenJson(
      `Esta foto es el horario de clase de un alumno de ${horario.curso.nombre}. Transcribe la cuadrícula. ` +
        'Una franja por cada fila, de arriba abajo, con su hora de inicio y de fin en formato HH:mm de 24 horas. ' +
        `Las filas de recreo, patio, comedor u otros descansos son de tipo DESCANSO, con su nombre en ${idioma} como etiqueta; ` +
        'las de clase son de tipo CLASE, con la etiqueta vacía. ' +
        'En cada franja de clase, pon para cada día de lunes (1) a viernes (5) la asignatura que tiene, eligiendo siempre ' +
        'la del listado que corresponda, aunque en la foto esté abreviada, en otro idioma o con otro nombre ' +
        '(por ejemplo «Mat.» es Matemáticas). Si una celda está vacía o no la entiendes, no la pongas. ' +
        'Si la foto no es un horario de clase, devuelve la lista de franjas vacía.',
      esquemaHorario(nombres),
      imagen,
    );

    const franjas = limpiarHorario(respuesta, porNombre);
    if (franjas.length === 0) {
      throw new BadGatewayException('La IA no ha dado una propuesta válida, inténtalo de nuevo');
    }
    await this.planes.registrarUsoIa(usuarioId, 'FOTO_HORARIO');
    return { franjas };
  }

  async proponerEntregas(usuarioId: string, imagen: Imagen, ahora = new Date()) {
    await this.comprobarIa(usuarioId);

    const horario = await this.horarios.obtenerActivo(usuarioId);
    const porNombre = new Map(
      (horario?.asignaturas ?? []).map((elegida) => [elegida.asignatura.nombre, elegida.id] as const),
    );
    const hoy = obtenerHoraLocal(ahora, this.config.get<string>('ZONA_HORARIA') || 'Europe/Madrid').fecha;
    const [anio, mes] = hoy.split('-').map(Number);
    const inicioCurso = mes >= 9 ? anio : anio - 1;
    const idioma = NOMBRE_IDIOMA_PARA_IA[await this.idiomaDe(usuarioId)];

    const respuesta = await this.ia.leerImagenJson(
      'Esta foto es un calendario, una agenda o una lista con los exámenes, trabajos o presentaciones de un alumno. ' +
        `Hoy es ${hoy} (curso escolar ${inicioCurso}-${inicioCurso + 1}). ` +
        'Saca cada examen, trabajo o presentación que tenga fecha: ' +
        `la fecha en formato YYYY-MM-DD (si no pone el año, el del curso escolar: de septiembre a diciembre, ${inicioCurso}; ` +
        `de enero a agosto, ${inicioCurso + 1}), ` +
        `un título corto y claro en ${idioma} (por ejemplo «Examen de Matemáticas: tema 3»), ` +
        'el tipo (EXAMEN, TRABAJO o PRESENTACION) y la asignatura del listado que corresponda, o una cadena vacía si no está. ' +
        'No inventes nada: lo que no tenga fecha, no lo pongas. Si la foto no tiene ninguno, devuelve la lista vacía.',
      esquemaEntregas([...porNombre.keys()]),
      imagen,
    );

    const entregas = limpiarEntregas(respuesta, porNombre, hoy);
    if (entregas.length === 0) {
      throw new BadGatewayException('La IA no ha dado una propuesta válida, inténtalo de nuevo');
    }
    await this.planes.registrarUsoIa(usuarioId, 'FOTO_EXAMENES');
    return { entregas };
  }

  private async comprobarIa(usuarioId: string) {
    await this.planes.comprobarUsoIa(usuarioId);
    if (!this.ia.leeImagenes()) {
      throw new ServiceUnavailableException('La IA no está disponible ahora mismo');
    }
  }

  private async idiomaDe(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { idioma: true } });
    return comoIdioma(usuario?.idioma);
  }
}

// La IA solo puede elegir asignaturas del listado (enum): así el nombre
// siempre se puede traducir a su id.
function esquemaHorario(nombres: string[]) {
  return {
    type: 'object',
    properties: {
      franjas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            horaInicio: { type: 'string' },
            horaFin: { type: 'string' },
            tipo: { type: 'string', enum: ['CLASE', 'DESCANSO'] },
            etiqueta: { type: 'string' },
            clases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  diaSemana: { type: 'integer' },
                  asignatura: { type: 'string', enum: nombres.length ? nombres : [''] },
                },
                required: ['diaSemana', 'asignatura'],
                additionalProperties: false,
              },
            },
          },
          required: ['horaInicio', 'horaFin', 'tipo', 'etiqueta', 'clases'],
          additionalProperties: false,
        },
      },
    },
    required: ['franjas'],
    additionalProperties: false,
  };
}

function esquemaEntregas(nombres: string[]) {
  return {
    type: 'object',
    properties: {
      entregas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            fecha: { type: 'string' },
            titulo: { type: 'string' },
            tipo: { type: 'string', enum: TIPOS_ESCOLARES },
            asignatura: { type: 'string', enum: [...nombres, ''] },
          },
          required: ['fecha', 'titulo', 'tipo', 'asignatura'],
          additionalProperties: false,
        },
      },
    },
    required: ['entregas'],
    additionalProperties: false,
  };
}

// "9:00", "09.00" o "09:00" → "09:00"; null si no es una hora válida.
function normalizarHora(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const partes = /^(\d{1,2})[:.h](\d{2})$/.exec(valor.trim());
  if (!partes) return null;
  const [horas, minutos] = [Number(partes[1]), Number(partes[2])];
  if (horas > 23 || minutos > 59) return null;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

// Lo que devuelve la IA nunca se da por bueno: horas válidas y en orden, sin
// franjas repetidas, sin clases en los descansos, días de lunes a viernes y
// solo asignaturas conocidas (una por celda).
export function limpiarHorario(respuesta: unknown, porNombre: Map<string, string>): FranjaPropuesta[] {
  const franjas = (respuesta as { franjas?: unknown })?.franjas;
  if (!Array.isArray(franjas)) return [];

  const limpias: FranjaPropuesta[] = [];
  for (const franja of franjas as Record<string, unknown>[]) {
    const horaInicio = normalizarHora(franja?.horaInicio);
    const horaFin = normalizarHora(franja?.horaFin);
    if (!horaInicio || !horaFin || horaInicio >= horaFin) continue;
    if (limpias.some((otra) => otra.horaInicio === horaInicio)) continue;
    const tipo: TipoFranja = franja.tipo === 'DESCANSO' ? 'DESCANSO' : 'CLASE';

    const clases: ClasePropuesta[] = [];
    if (tipo === 'CLASE' && Array.isArray(franja.clases)) {
      for (const clase of franja.clases as Record<string, unknown>[]) {
        const diaSemana = clase?.diaSemana;
        const nombre = clase?.asignatura;
        if (typeof diaSemana !== 'number' || !Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 5) continue;
        if (typeof nombre !== 'string' || !porNombre.has(nombre)) continue;
        if (clases.some((otra) => otra.diaSemana === diaSemana)) continue;
        clases.push({ diaSemana, asignaturaId: porNombre.get(nombre)!, nombre });
      }
      clases.sort((a, b) => a.diaSemana - b.diaSemana);
    }

    const etiqueta = typeof franja.etiqueta === 'string' ? franja.etiqueta.trim().slice(0, 40) : '';
    limpias.push({ horaInicio, horaFin, tipo, etiqueta: tipo === 'DESCANSO' ? etiqueta : '', clases });
  }

  return limpias.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).slice(0, MAXIMO_FRANJAS);
}

// Fechas reales y de hoy en adelante (lo pasado no sirve para planificar),
// títulos no vacíos, sin repetidos y en orden de fecha.
export function limpiarEntregas(
  respuesta: unknown,
  porNombre: Map<string, string>,
  hoy: string,
): EntregaPropuesta[] {
  const entregas = (respuesta as { entregas?: unknown })?.entregas;
  if (!Array.isArray(entregas)) return [];

  const limpias: EntregaPropuesta[] = [];
  for (const entrega of entregas as Record<string, unknown>[]) {
    const fecha = typeof entrega?.fecha === 'string' ? entrega.fecha.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
    // Fechas imposibles: 2026-13-01 no es fecha y 2026-02-30 "salta" a marzo.
    const comoFecha = new Date(`${fecha}T00:00:00Z`);
    if (Number.isNaN(comoFecha.getTime()) || comoFecha.toISOString().slice(0, 10) !== fecha) continue;
    if (fecha < hoy) continue;
    const titulo = typeof entrega.titulo === 'string' ? entrega.titulo.trim().slice(0, 120) : '';
    if (!titulo) continue;
    if (limpias.some((otra) => otra.fecha === fecha && otra.titulo === titulo)) continue;
    const tipo = TIPOS_ESCOLARES.includes(entrega.tipo as TipoEscolar) ? (entrega.tipo as TipoEscolar) : 'EXAMEN';
    const asignaturaHorarioId =
      typeof entrega.asignatura === 'string' ? (porNombre.get(entrega.asignatura) ?? null) : null;
    limpias.push({ fecha, titulo, tipo, asignaturaHorarioId });
  }

  return limpias.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, MAXIMO_ENTREGAS);
}
