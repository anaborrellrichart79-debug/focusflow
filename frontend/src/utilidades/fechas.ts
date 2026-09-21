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
