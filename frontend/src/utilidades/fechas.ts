const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

function inicioDelDia(fecha: Date) {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

export function diasHastaFecha(fechaIso: string): number {
  const hoy = inicioDelDia(new Date());
  const fecha = inicioDelDia(new Date(fechaIso));
  return Math.round((fecha.getTime() - hoy.getTime()) / MILISEGUNDOS_POR_DIA);
}

export function esUrgentePorFecha(fechaLimite: string | null): boolean {
  if (!fechaLimite) return false;
  return diasHastaFecha(fechaLimite) <= 2;
}

export function formatearFechaRelativa(fechaIso: string, localeIcu: string): string {
  const dias = diasHastaFecha(fechaIso);
  const formateador = new Intl.RelativeTimeFormat(localeIcu, { numeric: 'auto' });
  return formateador.format(dias, 'day');
}

// Duración por defecto (minutos) para una tarea con hora de inicio a la que
// no se le ha indicado ninguna: coincide con el valor que ya aplica el
// backend en GoogleService al construir el evento de Google Calendar.
export const DURACION_MINUTOS_POR_DEFECTO = 30;

// Una fecha límite "tiene hora de inicio" cuando no cae exactamente a
// medianoche UTC (la que pone un <input type="date">, sin hora). Mismo
// criterio que usa el backend en GoogleService para decidir si un evento de
// Google Calendar debe ser de todo el día o llevar hora.
export function tieneHoraInicio(fechaIso: string): boolean {
  const fecha = new Date(fechaIso);
  return (
    fecha.getUTCHours() !== 0 ||
    fecha.getUTCMinutes() !== 0 ||
    fecha.getUTCSeconds() !== 0 ||
    fecha.getUTCMilliseconds() !== 0
  );
}

// Parte de fecha (YYYY-MM-DD) para rellenar un <input type="date">.
export function obtenerSoloFecha(fechaIso: string): string {
  return fechaIso.slice(0, 10);
}

// Parte de hora (HH:MM, en UTC) para rellenar un <input type="time">; cadena
// vacía si la fecha límite no tiene hora de inicio.
export function obtenerSoloHora(fechaIso: string): string {
  if (!tieneHoraInicio(fechaIso)) return '';
  return new Date(fechaIso).toISOString().slice(11, 16);
}

// Combina una fecha (YYYY-MM-DD) y, opcionalmente, una hora (HH:MM) en un
// ISO-8601 completo en UTC, tal y como lo exige el backend. Se trata la hora
// tecleada como si ya fuera UTC (misma simplificación deliberada que ya
// aplicaba la fecha límite sin hora, guardada siempre a medianoche UTC):
// este proyecto no gestiona zonas horarias en ningún otro sitio.
export function combinarFechaYHora(fecha: string, hora: string): string {
  return `${fecha}T${hora || '00:00'}:00.000Z`;
}

// Fin de un bloque de tiempo: fechaLimite (hora de inicio) + duración.
export function calcularFinBloque(fechaIso: string, duracionMinutos: number | null): Date {
  const inicio = new Date(fechaIso);
  return new Date(inicio.getTime() + (duracionMinutos ?? DURACION_MINUTOS_POR_DEFECTO) * 60000);
}
