import type {
  AsignaturaHorario,
  CategoriaAsignatura,
  Curso,
  Horario,
  SesionClase,
} from '@/servicios/horarios';

// Lunes (1) a viernes (5), como SesionClase.diaSemana.
export const DIAS_LECTIVOS = [1, 2, 3, 4, 5] as const;

export interface Celda {
  sesion: SesionClase;
  asignatura: AsignaturaHorario;
}

// Índice "franjaId-dia" -> celda, para pintar la cuadrícula sin buscar en
// arrays dentro del render.
export function indexarCeldas(horario: Horario): Map<string, Celda> {
  const asignaturasPorId = new Map(horario.asignaturas.map((asignatura) => [asignatura.id, asignatura]));
  const celdas = new Map<string, Celda>();
  for (const sesion of horario.sesiones) {
    const asignatura = asignaturasPorId.get(sesion.asignaturaHorarioId);
    if (asignatura) celdas.set(claveCelda(sesion.franjaId, sesion.diaSemana), { sesion, asignatura });
  }
  return celdas;
}

export function claveCelda(franjaId: string, diaSemana: number) {
  return `${franjaId}-${diaSemana}`;
}

// Nombre del día en el idioma de la interfaz sin claves de traducción: el
// 1 de enero de 2024 fue lunes.
export function nombreDia(diaSemana: number, locale: string, formato: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(locale, { weekday: formato, timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, diaSemana)),
  );
}

// "26/27" entre septiembre y diciembre de 2026, y también de enero a agosto
// de 2027: el curso escolar empieza en septiembre.
export function periodoEscolarActual(hoy: Date = new Date()): string {
  const anio = hoy.getFullYear();
  const inicio = hoy.getMonth() >= 8 ? anio : anio - 1;
  const dosCifras = (valor: number) => String(valor % 100).padStart(2, '0');
  return `${dosCifras(inicio)}/${dosCifras(inicio + 1)}`;
}

export const ORDEN_CATEGORIAS: CategoriaAsignatura[] = [
  'OBLIGATORIA',
  'AUTONOMICA',
  'DE_OPCION',
  'OPTATIVA',
];

export function ordenarCursos(cursos: Curso[]) {
  const ordenEtapa = { PRIMARIA: 0, ESO: 1, BACHILLERATO: 2 };
  return [...cursos].sort(
    (a, b) => ordenEtapa[a.etapa] - ordenEtapa[b.etapa] || a.numero - b.numero,
  );
}
