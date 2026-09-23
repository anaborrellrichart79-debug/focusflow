import {
  CategoriaAsignatura,
  ComunidadAutonoma,
  Etapa,
} from '../generated/prisma/enums.js';

// Catálogo oficial de cursos y asignaturas según las enseñanzas mínimas de la
// LOMLOE: RD 157/2022 (Primaria, art. 8), RD 217/2022 (ESO, arts. 8 y 9) y
// RD 243/2022 (Bachillerato, arts. 11 a 14). Cada comunidad autónoma puede
// ampliar la oferta; aquí va lo común a todas más la lengua propia de las que
// la tienen. Los ids son fijos y legibles para que la carga al arrancar sea
// idempotente (createMany + skipDuplicates) y para poder referirse a ellos en
// los tests.

export interface CursoCatalogo {
  id: string;
  etapa: Etapa;
  numero: number;
  nombre: string;
}

export interface AsignaturaCatalogo {
  id: string;
  nombre: string;
  categoria: CategoriaAsignatura;
  modalidad: string | null;
  comunidad: ComunidadAutonoma | null;
  cursoId: string;
}

const { OBLIGATORIA, DE_OPCION, OPTATIVA, AUTONOMICA } = CategoriaAsignatura;

function crearCursos(
  etapa: Etapa,
  prefijo: string,
  cantidad: number,
  nombreEtapa: string,
) {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: `${prefijo}-${indice + 1}`,
    etapa,
    numero: indice + 1,
    nombre: `${indice + 1}º de ${nombreEtapa}`,
  }));
}

export const CURSOS: CursoCatalogo[] = [
  ...crearCursos(Etapa.PRIMARIA, 'primaria', 6, 'Primaria'),
  ...crearCursos(Etapa.ESO, 'eso', 4, 'ESO'),
  ...crearCursos(Etapa.BACHILLERATO, 'bachillerato', 2, 'Bachillerato'),
];

export function crearSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Definicion = [
  nombre: string,
  categoria: CategoriaAsignatura,
  modalidad?: string,
];

// --- Primaria (RD 157/2022, art. 8) ----------------------------------------

const PRIMARIA_COMUNES: Definicion[] = [
  ['Conocimiento del Medio Natural, Social y Cultural', OBLIGATORIA],
  ['Educación Artística', OBLIGATORIA],
  // El art. 8 permite desdoblar Educación Artística en estas dos áreas (y
  // muchas comunidades lo hacen): se ofrecen las tres y cada horario usa las
  // que correspondan.
  ['Educación Plástica y Visual', OBLIGATORIA],
  ['Música y Danza', OBLIGATORIA],
  ['Educación Física', OBLIGATORIA],
  ['Lengua Castellana y Literatura', OBLIGATORIA],
  ['Lengua Extranjera', OBLIGATORIA],
  ['Matemáticas', OBLIGATORIA],
  ['Segunda Lengua Extranjera', OPTATIVA],
  ['Religión', OPTATIVA],
  ['Atención Educativa', OPTATIVA],
];

// "Se añadirá en alguno de los cursos del tercer ciclo": se ofrece en 5º y 6º
// y cada centro la imparte en uno de los dos.
const PRIMARIA_TERCER_CICLO: Definicion[] = [
  ['Educación en Valores Cívicos y Éticos', OBLIGATORIA],
];

// --- ESO (RD 217/2022, arts. 8 y 9) ----------------------------------------

const ESO_PRIMER_A_TERCERO: Definicion[] = [
  ['Biología y Geología', OBLIGATORIA],
  ['Física y Química', OBLIGATORIA],
  ['Educación Física', OBLIGATORIA],
  ['Geografía e Historia', OBLIGATORIA],
  ['Lengua Castellana y Literatura', OBLIGATORIA],
  ['Lengua Extranjera', OBLIGATORIA],
  ['Matemáticas', OBLIGATORIA],
  ['Música', OBLIGATORIA],
  ['Educación Plástica, Visual y Audiovisual', OBLIGATORIA],
  ['Tecnología y Digitalización', OBLIGATORIA],
  ['Educación en Valores Cívicos y Éticos', OBLIGATORIA],
  ['Cultura Clásica', OPTATIVA],
  ['Segunda Lengua Extranjera', OPTATIVA],
  ['Proyecto Interdisciplinar', OPTATIVA],
  ['Religión', OPTATIVA],
  ['Atención Educativa', OPTATIVA],
];

const ESO_CUARTO: Definicion[] = [
  ['Educación Física', OBLIGATORIA],
  ['Geografía e Historia', OBLIGATORIA],
  ['Lengua Castellana y Literatura', OBLIGATORIA],
  ['Lengua Extranjera', OBLIGATORIA],
  ['Matemáticas A', DE_OPCION],
  ['Matemáticas B', DE_OPCION],
  ['Biología y Geología', DE_OPCION],
  ['Digitalización', DE_OPCION],
  ['Economía y Emprendimiento', DE_OPCION],
  ['Expresión Artística', DE_OPCION],
  ['Física y Química', DE_OPCION],
  ['Formación y Orientación Personal y Profesional', DE_OPCION],
  ['Latín', DE_OPCION],
  ['Música', DE_OPCION],
  ['Segunda Lengua Extranjera', DE_OPCION],
  ['Tecnología', DE_OPCION],
  ['Religión', OPTATIVA],
  ['Atención Educativa', OPTATIVA],
];

// --- Bachillerato (RD 243/2022) ---------------------------------------------

const CIENCIAS = 'Ciencias y Tecnología';
const HUMANIDADES = 'Humanidades y Ciencias Sociales';
const ARTES_PLASTICAS = 'Artes Plásticas, Imagen y Diseño';
const ARTES_MUSICA = 'Música y Artes Escénicas';
const GENERAL = 'General';

const BACHILLERATO_PRIMERO: Definicion[] = [
  ['Educación Física', OBLIGATORIA],
  ['Filosofía', OBLIGATORIA],
  ['Lengua Castellana y Literatura I', OBLIGATORIA],
  ['Lengua Extranjera I', OBLIGATORIA],
  ['Matemáticas I', DE_OPCION, CIENCIAS],
  ['Biología, Geología y Ciencias Ambientales', DE_OPCION, CIENCIAS],
  ['Dibujo Técnico I', DE_OPCION, CIENCIAS],
  ['Física y Química', DE_OPCION, CIENCIAS],
  ['Tecnología e Ingeniería I', DE_OPCION, CIENCIAS],
  ['Latín I', DE_OPCION, HUMANIDADES],
  ['Matemáticas Aplicadas a las Ciencias Sociales I', DE_OPCION, HUMANIDADES],
  ['Economía', DE_OPCION, HUMANIDADES],
  ['Griego I', DE_OPCION, HUMANIDADES],
  ['Historia del Mundo Contemporáneo', DE_OPCION, HUMANIDADES],
  ['Literatura Universal', DE_OPCION, HUMANIDADES],
  ['Dibujo Artístico I', DE_OPCION, ARTES_PLASTICAS],
  ['Cultura Audiovisual', DE_OPCION, ARTES_PLASTICAS],
  [
    'Dibujo Técnico Aplicado a las Artes Plásticas y al Diseño I',
    DE_OPCION,
    ARTES_PLASTICAS,
  ],
  ['Proyectos Artísticos', DE_OPCION, ARTES_PLASTICAS],
  ['Volumen', DE_OPCION, ARTES_PLASTICAS],
  ['Análisis Musical I', DE_OPCION, ARTES_MUSICA],
  ['Artes Escénicas I', DE_OPCION, ARTES_MUSICA],
  ['Coro y Técnica Vocal I', DE_OPCION, ARTES_MUSICA],
  ['Lenguaje y Práctica Musical', DE_OPCION, ARTES_MUSICA],
  ['Matemáticas Generales', DE_OPCION, GENERAL],
  ['Economía, Emprendimiento y Actividad Empresarial', DE_OPCION, GENERAL],
  ['Segunda Lengua Extranjera I', OPTATIVA],
  ['Religión', OPTATIVA],
];

const BACHILLERATO_SEGUNDO: Definicion[] = [
  ['Historia de España', OBLIGATORIA],
  ['Historia de la Filosofía', OBLIGATORIA],
  ['Lengua Castellana y Literatura II', OBLIGATORIA],
  ['Lengua Extranjera II', OBLIGATORIA],
  ['Matemáticas II', DE_OPCION, CIENCIAS],
  ['Biología', DE_OPCION, CIENCIAS],
  ['Dibujo Técnico II', DE_OPCION, CIENCIAS],
  ['Física', DE_OPCION, CIENCIAS],
  ['Geología y Ciencias Ambientales', DE_OPCION, CIENCIAS],
  ['Química', DE_OPCION, CIENCIAS],
  ['Tecnología e Ingeniería II', DE_OPCION, CIENCIAS],
  ['Latín II', DE_OPCION, HUMANIDADES],
  ['Matemáticas Aplicadas a las Ciencias Sociales II', DE_OPCION, HUMANIDADES],
  ['Empresa y Diseño de Modelos de Negocio', DE_OPCION, HUMANIDADES],
  ['Geografía', DE_OPCION, HUMANIDADES],
  ['Griego II', DE_OPCION, HUMANIDADES],
  ['Historia del Arte', DE_OPCION, HUMANIDADES],
  ['Dibujo Artístico II', DE_OPCION, ARTES_PLASTICAS],
  [
    'Dibujo Técnico Aplicado a las Artes Plásticas y al Diseño II',
    DE_OPCION,
    ARTES_PLASTICAS,
  ],
  ['Diseño', DE_OPCION, ARTES_PLASTICAS],
  ['Fundamentos Artísticos', DE_OPCION, ARTES_PLASTICAS],
  ['Técnicas de Expresión Gráfico-plástica', DE_OPCION, ARTES_PLASTICAS],
  ['Análisis Musical II', DE_OPCION, ARTES_MUSICA],
  ['Artes Escénicas II', DE_OPCION, ARTES_MUSICA],
  ['Coro y Técnica Vocal II', DE_OPCION, ARTES_MUSICA],
  ['Historia de la Música y de la Danza', DE_OPCION, ARTES_MUSICA],
  ['Literatura Dramática', DE_OPCION, ARTES_MUSICA],
  ['Ciencias Generales', DE_OPCION, GENERAL],
  ['Movimientos Culturales y Artísticos', DE_OPCION, GENERAL],
  ['Segunda Lengua Extranjera II', OPTATIVA],
  ['Religión', OPTATIVA],
];

// --- Lengua propia de cada comunidad autónoma -------------------------------
// "Lengua Castellana y Literatura y, si la hubiere, Lengua Cooficial y
// Literatura" (en las tres etapas). En Bachillerato llevan I/II como el resto.

export const LENGUAS_PROPIAS: {
  comunidad: ComunidadAutonoma;
  nombre: string;
}[] = [
  {
    comunidad: ComunidadAutonoma.COMUNITAT_VALENCIANA,
    nombre: 'Valenciano: Lengua y Literatura',
  },
  {
    comunidad: ComunidadAutonoma.CATALUNA,
    nombre: 'Lengua Catalana y Literatura',
  },
  { comunidad: ComunidadAutonoma.CATALUNA, nombre: 'Aranés' },
  {
    comunidad: ComunidadAutonoma.BALEARES,
    nombre: 'Lengua Catalana y Literatura',
  },
  {
    comunidad: ComunidadAutonoma.GALICIA,
    nombre: 'Lingua Galega e Literatura',
  },
  {
    comunidad: ComunidadAutonoma.PAIS_VASCO,
    nombre: 'Lengua Vasca y Literatura',
  },
  { comunidad: ComunidadAutonoma.NAVARRA, nombre: 'Lengua Vasca y Literatura' },
  {
    comunidad: ComunidadAutonoma.ASTURIAS,
    nombre: 'Llingua Asturiana y Literatura',
  },
  { comunidad: ComunidadAutonoma.ARAGON, nombre: 'Lengua Aragonesa' },
  { comunidad: ComunidadAutonoma.ARAGON, nombre: 'Lengua Catalana' },
];

function asignaturasDeCurso(
  cursoId: string,
  definiciones: Definicion[],
): AsignaturaCatalogo[] {
  return definiciones.map(([nombre, categoria, modalidad]) => ({
    id: `${cursoId}-${crearSlug(nombre)}`,
    nombre,
    categoria,
    modalidad: modalidad ?? null,
    comunidad: null,
    cursoId,
  }));
}

function lenguasPropiasDeCurso(curso: CursoCatalogo): AsignaturaCatalogo[] {
  const sufijo =
    curso.etapa === Etapa.BACHILLERATO
      ? curso.numero === 1
        ? ' I'
        : ' II'
      : '';
  return LENGUAS_PROPIAS.map(({ comunidad, nombre }) => {
    const nombreCompleto = `${nombre}${sufijo}`;
    return {
      id: `${curso.id}-${crearSlug(comunidad)}-${crearSlug(nombreCompleto)}`,
      nombre: nombreCompleto,
      categoria: AUTONOMICA,
      modalidad: null,
      comunidad,
      cursoId: curso.id,
    };
  });
}

function definicionesDeCurso(curso: CursoCatalogo): Definicion[] {
  switch (curso.etapa) {
    case Etapa.PRIMARIA:
      return curso.numero >= 5
        ? [...PRIMARIA_COMUNES, ...PRIMARIA_TERCER_CICLO]
        : PRIMARIA_COMUNES;
    case Etapa.ESO:
      return curso.numero === 4 ? ESO_CUARTO : ESO_PRIMER_A_TERCERO;
    case Etapa.BACHILLERATO:
      return curso.numero === 1 ? BACHILLERATO_PRIMERO : BACHILLERATO_SEGUNDO;
  }
}

export const ASIGNATURAS: AsignaturaCatalogo[] = CURSOS.flatMap((curso) => [
  ...asignaturasDeCurso(curso.id, definicionesDeCurso(curso)),
  ...lenguasPropiasDeCurso(curso),
]);
