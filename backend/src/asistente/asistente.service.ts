import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { comoIdioma, NOMBRE_IDIOMA_PARA_IA } from '../comun/idiomas.js';
import { IaService } from '../ia/ia.service.js';
import { PlanesService } from '../planes/planes.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { sumarDias } from '../recordatorios/calendario-escolar.js';
import { obtenerHoraLocal } from '../recordatorios/hora-local.util.js';

const MAXIMO_PASOS = 8;
const MAXIMO_DIAS_PLAN = 14;
const MAXIMO_SESIONES_POR_DIA = 2;
const LONGITUD_MAXIMA_TITULO = 120;
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface SesionEstudio {
  fecha: string; // YYYY-MM-DD
  titulo: string;
  minutos: number;
}

// Quita numeraciones y viñetas que a veces añade el modelo ("1. ", "- ").
function limpiarTitulo(texto: unknown) {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
    .trim()
    .slice(0, LONGITUD_MAXIMA_TITULO);
}

// Lo que propone Ollama nunca se da por bueno sin revisar: textos vacíos,
// repetidos (entre sí o con las subtareas que ya hay) o de más se descartan.
export function limpiarPasos(respuesta: unknown, existentes: string[]): string[] {
  const pasos = (respuesta as { pasos?: unknown })?.pasos;
  if (!Array.isArray(pasos)) return [];
  const vistos = new Set(existentes.map((titulo) => titulo.trim().toLowerCase()));
  const resultado: string[] = [];
  for (const paso of pasos) {
    const titulo = limpiarTitulo(paso);
    const clave = titulo.toLowerCase();
    if (!titulo || vistos.has(clave)) continue;
    vistos.add(clave);
    resultado.push(titulo);
    if (resultado.length === MAXIMO_PASOS) break;
  }
  return resultado;
}

// Solo días de la lista ofrecida, como mucho 2 sesiones por día, entre 15 y
// 120 minutos cada una, ordenadas por fecha.
export function limpiarPlan(respuesta: unknown, diasPermitidos: string[]): SesionEstudio[] {
  const sesiones = (respuesta as { sesiones?: unknown })?.sesiones;
  if (!Array.isArray(sesiones)) return [];
  const permitidos = new Set(diasPermitidos);
  const porDia = new Map<string, number>();
  const vistos = new Set<string>();
  const resultado: SesionEstudio[] = [];
  for (const sesion of sesiones as { fecha?: unknown; titulo?: unknown; minutos?: unknown }[]) {
    const fecha = typeof sesion?.fecha === 'string' ? sesion.fecha.slice(0, 10) : '';
    const titulo = limpiarTitulo(sesion?.titulo);
    if (!permitidos.has(fecha) || !titulo) continue;
    if ((porDia.get(fecha) ?? 0) >= MAXIMO_SESIONES_POR_DIA) continue;
    const clave = `${fecha}|${titulo.toLowerCase()}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    porDia.set(fecha, (porDia.get(fecha) ?? 0) + 1);
    const minutos = Math.round(Number(sesion?.minutos));
    resultado.push({ fecha, titulo, minutos: Number.isFinite(minutos) ? Math.min(120, Math.max(15, minutos)) : 30 });
  }
  return resultado.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Los días que se pueden planificar: desde hoy hasta la víspera de la fecha
// límite, como mucho los 14 últimos (más allá, el modelo se pierde).
export function diasParaEstudiar(hoy: string, fechaLimite: string): string[] {
  const dias: string[] = [];
  for (let dia = sumarDias(fechaLimite, -1); dia >= hoy && dias.length < MAXIMO_DIAS_PLAN; dia = sumarDias(dia, -1)) {
    dias.unshift(dia);
  }
  return dias;
}

// Propuestas de la IA local (Ollama) para una tarea: dividirla en subtareas o
// repartir el estudio hasta su fecha límite. Solo proponen: el frontend enseña
// la propuesta y guarda lo que el usuario acepte con los endpoints de siempre.
@Injectable()
export class AsistenteService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly ia: IaService,
    private readonly planes: PlanesService,
    private readonly config: ConfigService,
  ) {}

  private async tareaDelUsuario(usuarioId: string, tareaId: string) {
    const tarea = await this.prisma.tarea.findFirst({
      where: { id: tareaId, usuarioId },
      include: {
        subtareas: { select: { titulo: true } },
        asignaturaHorario: { select: { asignatura: { select: { nombre: true } } } },
        usuario: { select: { idioma: true } },
      },
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    return tarea;
  }

  // Primero el plan (sin IA incluida o sin usos este mes no se pregunta a
  // nadie) y después si la IA responde.
  private async comprobarIa(usuarioId: string) {
    await this.planes.comprobarUsoIa(usuarioId);
    if (!(await this.ia.disponible())) {
      throw new ServiceUnavailableException('La IA no está disponible ahora mismo');
    }
  }

  async proponerSubtareas(usuarioId: string, tareaId: string) {
    const tarea = await this.tareaDelUsuario(usuarioId, tareaId);
    await this.comprobarIa(usuarioId);
    const existentes = tarea.subtareas.map((subtarea) => subtarea.titulo);

    const respuesta = await this.ia.generarJson(
      'Eres el asistente de FocusFlow, una app de organización para estudiantes. ' +
        `Divide esta tarea en entre 3 y ${MAXIMO_PASOS} pasos concretos, en el orden en que conviene hacerlos. ` +
        'Cada paso es una frase corta (máximo 12 palabras) que empieza por un verbo. ' +
        `Escribe en ${NOMBRE_IDIOMA_PARA_IA[comoIdioma(tarea.usuario.idioma)]}. ` +
        `Tarea: «${tarea.titulo}». ` +
        (tarea.descripcion ? `Descripción: ${tarea.descripcion}. ` : '') +
        (tarea.asignaturaHorario ? `Asignatura: ${tarea.asignaturaHorario.asignatura.nombre}. ` : '') +
        (existentes.length ? `No repitas estos pasos, que ya tiene: ${existentes.join('; ')}.` : ''),
      {
        type: 'object',
        properties: { pasos: { type: 'array', items: { type: 'string' } } },
        required: ['pasos'],
        additionalProperties: false,
      },
    );

    const pasos = limpiarPasos(respuesta, existentes);
    if (pasos.length === 0) {
      throw new BadGatewayException('La IA no ha dado una propuesta válida, inténtalo de nuevo');
    }
    await this.planes.registrarUsoIa(usuarioId, 'SUBTAREAS');
    return { pasos };
  }

  async proponerPlanEstudio(usuarioId: string, tareaId: string, ahora = new Date()) {
    const tarea = await this.tareaDelUsuario(usuarioId, tareaId);
    if (!tarea.fechaLimite) {
      throw new BadRequestException('Ponle una fecha límite a la tarea para poder planificar el estudio');
    }
    const hoy = obtenerHoraLocal(ahora, this.config.get<string>('ZONA_HORARIA') || 'Europe/Madrid').fecha;
    const dias = diasParaEstudiar(hoy, tarea.fechaLimite.toISOString().slice(0, 10));
    if (dias.length === 0) {
      throw new BadRequestException('No quedan días para estudiar antes de la fecha límite');
    }
    await this.comprobarIa(usuarioId);

    const listaDias = dias
      .map((dia) => `${dia} (${DIAS_SEMANA[new Date(`${dia}T00:00:00Z`).getUTCDay()]})`)
      .join(', ');
    const respuesta = await this.ia.generarJson(
      'Eres el asistente de FocusFlow, una app de organización para estudiantes. ' +
        `Prepara un plan de estudio para «${tarea.titulo}», que es el ${tarea.fechaLimite.toISOString().slice(0, 10)}. ` +
        (tarea.descripcion ? `Qué entra o de qué trata: ${tarea.descripcion}. ` : '') +
        (tarea.asignaturaHorario ? `Asignatura: ${tarea.asignaturaHorario.asignatura.nombre}. ` : '') +
        (tarea.subtareas.length ? `Partes que ya tiene apuntadas: ${tarea.subtareas.map((s) => s.titulo).join('; ')}. ` : '') +
        `Reparte el trabajo en sesiones cortas usando solo estos días: ${listaDias}. ` +
        'Empieza por entender y aprender, y deja los últimos días para repasar y practicar. ' +
        'Como mucho 2 sesiones por día; no hace falta usar todos los días (el fin de semana, más ligero). ' +
        'Cada sesión: fecha (YYYY-MM-DD), un título corto y concreto de qué hacer, y los minutos (entre 15 y 90). ' +
        `Escribe los títulos en ${NOMBRE_IDIOMA_PARA_IA[comoIdioma(tarea.usuario.idioma)]}.`,
      {
        type: 'object',
        properties: {
          sesiones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fecha: { type: 'string' },
                titulo: { type: 'string' },
                minutos: { type: 'integer' },
              },
              required: ['fecha', 'titulo', 'minutos'],
              additionalProperties: false,
            },
          },
        },
        required: ['sesiones'],
        additionalProperties: false,
      },
    );

    const sesiones = limpiarPlan(respuesta, dias);
    if (sesiones.length === 0) {
      throw new BadGatewayException('La IA no ha dado una propuesta válida, inténtalo de nuevo');
    }
    await this.planes.registrarUsoIa(usuarioId, 'PLAN_ESTUDIO');
    return { sesiones };
  }
}
