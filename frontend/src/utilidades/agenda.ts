import type { Tarea } from '@/servicios/tareas';
import { obtenerSoloFecha, tieneHoraInicio } from './fechas';

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
