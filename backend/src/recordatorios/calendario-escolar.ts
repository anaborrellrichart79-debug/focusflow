import type { ComunidadAutonoma } from '../generated/prisma/enums.js';

// Calendario escolar oficial del curso 2026-2027 por comunidad autónoma.
// Fuente: resumen de elDiario.es del 17/08/2026 con las resoluciones de cada
// consejería (la Comunitat Valenciana, contrastada además con la GVA y el
// DOGV del 18/06/2026). Solo recoge lo común a toda la comunidad: inicio y
// fin de clases de Infantil/Primaria (donde ESO cambia, se toma el último día
// lectivo más tardío), Navidad, Semana Santa, los festivos nacionales que caen
// en día lectivo (12 oct y 8 dic) y el día de la comunidad si cae en día
// lectivo. Las fiestas locales y los días de libre disposición de cada centro
// no están: el usuario los añade como días no lectivos propios.
// Hay que actualizarlo cada curso.

export const CURSO_CALENDARIO_ESCOLAR = '2026-2027';

export interface PeriodoNoLectivo {
  clave: string;
  nombre: string;
  inicio: string; // YYYY-MM-DD, primer día sin clase
  fin: string; // YYYY-MM-DD, último día sin clase
}

export interface CalendarioComunidad {
  inicioClases: string;
  finClases: string;
  periodos: PeriodoNoLectivo[];
}

// Suma días a una fecha "YYYY-MM-DD" sin pasar por la zona horaria local.
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, diaMes] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, diaMes + dias))
    .toISOString()
    .slice(0, 10);
}

function navidad(inicio: string, fin: string): PeriodoNoLectivo {
  return { clave: 'navidad', nombre: 'Vacaciones de Navidad', inicio, fin };
}

function semanaSanta(inicio: string, fin: string): PeriodoNoLectivo {
  return {
    clave: 'semana-santa',
    nombre: 'Vacaciones de Semana Santa',
    inicio,
    fin,
  };
}

function dia(clave: string, nombre: string, fecha: string): PeriodoNoLectivo {
  return { clave, nombre, inicio: fecha, fin: fecha };
}

const FESTIVOS_NACIONALES = [
  dia('hispanidad', 'Fiesta Nacional de España', '2026-10-12'),
  dia('inmaculada', 'Día de la Inmaculada Concepción', '2026-12-08'),
];

function comunidad(
  inicioClases: string,
  finClases: string,
  periodos: PeriodoNoLectivo[],
): CalendarioComunidad {
  // El verano cuenta como periodo no lectivo para poder avisar antes de que
  // acabe el curso (hasta el 31 de agosto, el nuevo calendario aún no existe).
  const verano: PeriodoNoLectivo = {
    clave: 'verano',
    nombre: 'Vacaciones de verano',
    inicio: sumarDias(finClases, 1),
    fin: '2027-08-31',
  };
  return {
    inicioClases,
    finClases,
    periodos: [...FESTIVOS_NACIONALES, ...periodos, verano].sort((a, b) =>
      a.inicio.localeCompare(b.inicio),
    ),
  };
}

export const CALENDARIO_ESCOLAR: Record<
  ComunidadAutonoma,
  CalendarioComunidad
> = {
  ANDALUCIA: comunidad('2026-09-10', '2027-06-22', [
    navidad('2026-12-23', '2027-01-06'),
    semanaSanta('2027-03-22', '2027-03-29'),
  ]),
  ARAGON: comunidad('2026-09-08', '2027-06-18', [
    navidad('2026-12-22', '2027-01-06'),
    semanaSanta('2027-03-25', '2027-04-02'),
    dia('dia-comunidad', 'Día de Aragón', '2027-04-23'),
  ]),
  ASTURIAS: comunidad('2026-09-09', '2027-06-23', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-20', '2027-03-28'),
  ]),
  BALEARES: comunidad('2026-09-10', '2027-06-18', [
    navidad('2026-12-23', '2027-01-06'),
    dia('dia-comunidad', 'Día de las Illes Balears', '2027-03-01'),
    semanaSanta('2027-03-25', '2027-04-04'),
  ]),
  CANARIAS: comunidad('2026-09-09', '2027-06-22', [
    navidad('2026-12-22', '2027-01-07'),
    semanaSanta('2027-03-22', '2027-03-26'),
  ]),
  CANTABRIA: comunidad('2026-09-08', '2027-06-24', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-20', '2027-03-28'),
  ]),
  CASTILLA_LA_MANCHA: comunidad('2026-09-08', '2027-06-22', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-22', '2027-03-29'),
    dia('dia-comunidad', 'Día de Castilla-La Mancha', '2027-05-31'),
  ]),
  CASTILLA_Y_LEON: comunidad('2026-09-09', '2027-06-24', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-19', '2027-03-30'),
    dia('dia-comunidad', 'Día de Castilla y León', '2027-04-23'),
  ]),
  CATALUNA: comunidad('2026-09-08', '2027-06-21', [
    dia('dia-comunidad', 'Diada de Catalunya', '2026-09-11'),
    navidad('2026-12-22', '2027-01-07'),
    semanaSanta('2027-03-20', '2027-03-29'),
  ]),
  COMUNITAT_VALENCIANA: comunidad('2026-09-09', '2027-06-18', [
    dia('dia-comunidad', 'Día de la Comunitat Valenciana', '2026-10-09'),
    navidad('2026-12-22', '2027-01-06'),
    semanaSanta('2027-03-25', '2027-04-05'),
  ]),
  EXTREMADURA: comunidad('2026-09-10', '2027-06-18', [
    navidad('2026-12-23', '2027-01-07'),
    semanaSanta('2027-03-22', '2027-03-29'),
  ]),
  GALICIA: comunidad('2026-09-09', '2027-06-21', [
    navidad('2026-12-22', '2027-01-07'),
    semanaSanta('2027-03-19', '2027-03-29'),
    dia('dia-comunidad', 'Día de las Letras Gallegas', '2027-05-17'),
  ]),
  MADRID: comunidad('2026-09-07', '2027-06-18', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-19', '2027-03-29'),
  ]),
  MURCIA: comunidad('2026-09-08', '2027-06-22', [
    navidad('2026-12-23', '2027-01-06'),
    semanaSanta('2027-03-22', '2027-03-29'),
    dia('dia-comunidad', 'Día de la Región de Murcia', '2027-06-09'),
  ]),
  NAVARRA: comunidad('2026-09-08', '2027-06-22', [
    dia('dia-comunidad', 'Día de Navarra', '2026-12-03'),
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-25', '2027-04-04'),
  ]),
  PAIS_VASCO: comunidad('2026-09-08', '2027-06-18', [
    navidad('2026-12-24', '2027-01-06'),
    semanaSanta('2027-03-25', '2027-03-29'),
  ]),
  LA_RIOJA: comunidad('2026-09-09', '2027-06-22', [
    navidad('2026-12-23', '2027-01-06'),
    semanaSanta('2027-03-25', '2027-04-04'),
    dia('dia-comunidad', 'Día de La Rioja', '2027-06-09'),
  ]),
  CEUTA: comunidad('2026-09-08', '2027-06-23', [
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-22', '2027-04-02'),
  ]),
  MELILLA: comunidad('2026-09-09', '2027-06-23', [
    dia('dia-comunidad', 'Día de Melilla', '2026-09-17'),
    navidad('2026-12-23', '2027-01-10'),
    semanaSanta('2027-03-22', '2027-03-26'),
  ]),
};
