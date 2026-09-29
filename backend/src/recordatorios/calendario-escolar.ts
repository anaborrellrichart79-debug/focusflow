import { ComunidadAutonoma } from '../generated/prisma/enums.js';

// Calendario escolar oficial por curso y comunidad autónoma. Los datos no
// están aquí sino en backend/datos/calendarios-escolares/<curso>.json (uno por
// curso, ver el LEEME.md de esa carpeta): para el curso siguiente basta con
// añadir su fichero, sin tocar código. Solo recoge lo común a toda la
// comunidad: inicio y fin de clases, Navidad, Semana Santa, los festivos
// nacionales que caen en día lectivo y el día de la comunidad. Las fiestas
// locales y los días de libre disposición de cada centro no están: el usuario
// los añade como días no lectivos propios.

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

export interface CalendarioCurso {
  curso: string; // "2026-2027"
  // Del 1 de septiembre al 31 de agosto: qué curso toca según la fecha.
  desde: string;
  hasta: string;
  comunidades: Record<ComunidadAutonoma, CalendarioComunidad>;
}

// Forma del fichero JSON de cada curso.
interface Rango {
  inicio: string;
  fin: string;
}
interface FicheroComunidad {
  inicioClases: string;
  finClases: string;
  navidad: Rango;
  semanaSanta: Rango;
  diaComunidad?: { nombre: string; fecha: string };
}
export interface FicheroCalendario {
  curso: string;
  fuente?: string;
  festivosNacionales: { clave: string; nombre: string; fecha: string }[];
  comunidades: Record<string, FicheroComunidad>;
}

// Suma días a una fecha "YYYY-MM-DD" sin pasar por la zona horaria local.
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, diaMes] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, diaMes + dias))
    .toISOString()
    .slice(0, 10);
}

function esFecha(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor
  );
}

// Valida el fichero de un curso y lo convierte en los periodos no lectivos de
// cada comunidad. Lanza un Error con todos los problemas encontrados, para
// que el aviso del log diga exactamente qué hay que corregir.
export function construirCalendario(fichero: FicheroCalendario): CalendarioCurso {
  const problemas: string[] = [];
  const cursoValido = /^(\d{4})-(\d{4})$/.exec(fichero?.curso ?? '');
  if (!cursoValido || Number(cursoValido[2]) !== Number(cursoValido[1]) + 1) {
    throw new Error(`"curso" debe ser como "2026-2027" (es ${JSON.stringify(fichero?.curso)})`);
  }
  const [anioInicio, anioFin] = [cursoValido[1], cursoValido[2]];
  const desde = `${anioInicio}-09-01`;
  const hasta = `${anioFin}-08-31`;

  function comprobarFecha(fecha: unknown, donde: string) {
    if (!esFecha(fecha)) problemas.push(`${donde}: fecha no válida (${JSON.stringify(fecha)})`);
    else if (fecha < desde || fecha > hasta) problemas.push(`${donde}: ${fecha} está fuera del curso`);
  }
  function comprobarRango(rango: Rango | undefined, donde: string) {
    comprobarFecha(rango?.inicio, `${donde}.inicio`);
    comprobarFecha(rango?.fin, `${donde}.fin`);
    if (esFecha(rango?.inicio) && esFecha(rango?.fin) && rango.fin < rango.inicio) {
      problemas.push(`${donde}: el fin es anterior al inicio`);
    }
  }

  const festivos = (fichero.festivosNacionales ?? []).map((festivo, indice) => {
    comprobarFecha(festivo.fecha, `festivosNacionales[${indice}]`);
    if (!festivo.clave || !festivo.nombre) problemas.push(`festivosNacionales[${indice}]: falta clave o nombre`);
    return { clave: festivo.clave, nombre: festivo.nombre, inicio: festivo.fecha, fin: festivo.fecha };
  });

  const comunidades = {} as Record<ComunidadAutonoma, CalendarioComunidad>;
  for (const codigo of Object.values(ComunidadAutonoma)) {
    const datos = fichero.comunidades?.[codigo];
    if (!datos) {
      problemas.push(`falta la comunidad ${codigo}`);
      continue;
    }
    comprobarRango({ inicio: datos.inicioClases, fin: datos.finClases }, `${codigo}.clases`);
    comprobarRango(datos.navidad, `${codigo}.navidad`);
    comprobarRango(datos.semanaSanta, `${codigo}.semanaSanta`);
    if (datos.diaComunidad) comprobarFecha(datos.diaComunidad.fecha, `${codigo}.diaComunidad`);

    const periodos: PeriodoNoLectivo[] = [
      ...festivos,
      { clave: 'navidad', nombre: 'Vacaciones de Navidad', ...datos.navidad },
      { clave: 'semana-santa', nombre: 'Vacaciones de Semana Santa', ...datos.semanaSanta },
      ...(datos.diaComunidad
        ? [{ clave: 'dia-comunidad', nombre: datos.diaComunidad.nombre, inicio: datos.diaComunidad.fecha, fin: datos.diaComunidad.fecha }]
        : []),
      // El verano cuenta como periodo no lectivo para poder avisar antes de
      // que acabe el curso (hasta el 31 de agosto).
      { clave: 'verano', nombre: 'Vacaciones de verano', inicio: esFecha(datos.finClases) ? sumarDias(datos.finClases, 1) : hasta, fin: hasta },
    ];
    comunidades[codigo] = {
      inicioClases: datos.inicioClases,
      finClases: datos.finClases,
      periodos: periodos.sort((a, b) => a.inicio.localeCompare(b.inicio)),
    };
  }
  for (const codigo of Object.keys(fichero.comunidades ?? {})) {
    if (!(codigo in ComunidadAutonoma)) problemas.push(`comunidad desconocida: ${codigo}`);
  }

  if (problemas.length > 0) throw new Error(problemas.join('; '));
  return { curso: fichero.curso, desde, hasta, comunidades };
}

// El curso de hoy; si no hay fichero para él, el más reciente de los que ya
// han empezado (mejor un calendario viejo que ninguno) o, si todos son
// futuros, el más próximo.
export function elegirCurso(cursos: CalendarioCurso[], hoy: string): CalendarioCurso | null {
  const ordenados = [...cursos].sort((a, b) => a.desde.localeCompare(b.desde));
  return (
    ordenados.find((curso) => curso.desde <= hoy && hoy <= curso.hasta) ??
    ordenados.filter((curso) => curso.desde <= hoy).at(-1) ??
    ordenados[0] ??
    null
  );
}
