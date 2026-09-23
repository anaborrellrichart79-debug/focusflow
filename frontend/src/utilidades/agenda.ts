import type { Horario } from '@/servicios/horarios';
import type { CalendarioEscolar } from '@/servicios/recordatorios';
import type { Tarea } from '@/servicios/tareas';
import { esDiaNoLectivo } from './avisos';
import { obtenerSoloFecha, obtenerSoloHora, tieneHoraInicio } from './fechas';

// Todo el cálculo de días/semanas/meses de la Agenda se hace en UTC, no en
// hora local: la hora de una tarea se trata como si ya fuera UTC (ver
// combinarFechaYHora en fechas.ts), así que agrupar por día también en UTC
// evita que una tarea "se mueva" de día solo por la zona horaria de quien
// mira la Agenda.
function inicioSemanaUtc(fecha: Date): Date {
  const copia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const diasDesdeLunes = (copia.getUTCDay() + 6) % 7;
  copia.setUTCDate(copia.getUTCDate() - diasDesdeLunes);
  return copia;
}

export function obtenerDiasSemana(fecha: Date): Date[] {
  const inicio = inicioSemanaUtc(fecha);
  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(inicio);
    dia.setUTCDate(dia.getUTCDate() + indice);
    return dia;
  });
}

// Semanas completas (lunes a domingo) que cubren el mes de `fecha`,
// incluyendo días del mes anterior/siguiente para rellenar la cuadrícula.
export function obtenerSemanasMes(fecha: Date): Date[][] {
  const primerDiaMes = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
  const ultimoDiaMes = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0));
  const inicio = inicioSemanaUtc(primerDiaMes);
  const finSemana = inicioSemanaUtc(ultimoDiaMes);
  finSemana.setUTCDate(finSemana.getUTCDate() + 6);

  const dias: Date[] = [];
  const cursor = new Date(inicio);
  while (cursor <= finSemana) {
    dias.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const semanas: Date[][] = [];
  for (let indice = 0; indice < dias.length; indice += 7) {
    semanas.push(dias.slice(indice, indice + 7));
  }
  return semanas;
}

export function tareasDelDia(tareas: Tarea[], fecha: Date): Tarea[] {
  const clave = fecha.toISOString().slice(0, 10);
  return tareas.filter((tarea) => tarea.fechaLimite && obtenerSoloFecha(tarea.fechaLimite) === clave);
}

// Las tareas sin hora (todo el día) van primero, como los eventos de todo el
// día en Google Calendar; el resto, por hora ascendente.
export function ordenarTareasDelDia(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    const conHoraA = a.fechaLimite != null && tieneHoraInicio(a.fechaLimite);
    const conHoraB = b.fechaLimite != null && tieneHoraInicio(b.fechaLimite);
    if (conHoraA === conHoraB) {
      if (!conHoraA) return 0;
      return a.fechaLimite!.localeCompare(b.fechaLimite!);
    }
    return conHoraA ? 1 : -1;
  });
}

export interface ClaseAgenda {
  id: string;
  horaInicio: string;
  horaFin: string;
  nombre: string;
  color: string;
  aula: string | null;
}

// Clases del horario activo que caen en `fecha` (lunes a viernes; los fines
// de semana no hay). El horario se repite igual todas las semanas: no sabe de
// festivos ni vacaciones.
// Con el calendario escolar, los días no lectivos (vacaciones, festivos, fuera
// del curso) no tienen clases.
export function clasesDelDia(
  horario: Horario | null,
  fecha: Date,
  calendario: CalendarioEscolar | null = null,
): ClaseAgenda[] {
  if (!horario || esDiaNoLectivo(calendario, fecha)) return [];
  const diaSemana = fecha.getUTCDay();
  if (diaSemana < 1 || diaSemana > 5) return [];

  const franjas = new Map(horario.franjas.map((franja) => [franja.id, franja]));
  const asignaturas = new Map(horario.asignaturas.map((asignatura) => [asignatura.id, asignatura]));

  return horario.sesiones
    .filter((sesion) => sesion.diaSemana === diaSemana)
    .flatMap((sesion) => {
      const franja = franjas.get(sesion.franjaId);
      const asignatura = asignaturas.get(sesion.asignaturaHorarioId);
      if (!franja || !asignatura) return [];
      return [
        {
          id: sesion.id,
          horaInicio: franja.horaInicio,
          horaFin: franja.horaFin,
          nombre: asignatura.asignatura.nombre,
          color: asignatura.color,
          aula: sesion.aula,
        },
      ];
    })
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

export type ElementoAgenda =
  | { tipo: 'tarea'; tarea: Tarea; hora: string | null }
  | { tipo: 'clase'; clase: ClaseAgenda; hora: string };

// Mezcla las tareas y las clases de un día en el orden en que se viven: las
// tareas sin hora primero (como en ordenarTareasDelDia) y luego todo lo que
// tiene hora, por hora; a la misma hora, la clase va antes que la tarea.
export function combinarDia(tareas: Tarea[], clases: ClaseAgenda[]): ElementoAgenda[] {
  const sinHora: ElementoAgenda[] = [];
  const conHora: ElementoAgenda[] = clases.map((clase) => ({
    tipo: 'clase',
    clase,
    hora: clase.horaInicio,
  }));
  for (const tarea of ordenarTareasDelDia(tareas)) {
    const hora = tarea.fechaLimite && tieneHoraInicio(tarea.fechaLimite)
      ? obtenerSoloHora(tarea.fechaLimite)
      : null;
    if (hora) conHora.push({ tipo: 'tarea', tarea, hora });
    else sinHora.push({ tipo: 'tarea', tarea, hora: null });
  }
  conHora.sort(
    (a, b) =>
      a.hora!.localeCompare(b.hora!) || (a.tipo === b.tipo ? 0 : a.tipo === 'clase' ? -1 : 1),
  );
  return [...sinHora, ...conHora];
}
