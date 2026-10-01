import type { CodigoIdioma } from '@/idiomas';
import { ca } from './ca';
import { en } from './en';
import { es } from './es';
import { eu } from './eu';
import { gl } from './gl';
import type { IdTemaAyuda, IdVideoAyuda, TextosAyuda } from './tipos';
import { va } from './va';

export type { IdTemaAyuda, IdVideoAyuda, TemaAyuda, TextosAyuda } from './tipos';

export const TEXTOS_AYUDA: Record<CodigoIdioma, TextosAyuda> = { es, va, gl, eu, ca, en };

// Los vídeos (sin sonido, grabados en castellano con cuentas de demostración)
// están en public/media/ayuda, no en public/ayuda: en el servidor, una carpeta
// ayuda/ taparía la página /ayuda (nginx respondía 403 al entrar directamente).
export const ARCHIVO_VIDEO: Record<IdVideoAyuda, string> = {
  horarioFoto: '/media/ayuda/horario-foto.webm',
  examenesFoto: '/media/ayuda/examenes-foto.webm',
  deberesFoto: '/media/ayuda/deberes-foto.webm',
  planEstudio: '/media/ayuda/plan-estudio.webm',
  agenda: '/media/ayuda/agenda.webm',
  pomodoroEstadisticas: '/media/ayuda/pomodoro-estadisticas.webm',
  familiaPedirRevision: '/media/ayuda/familia-pedir-revision.webm',
  familiaRevisar: '/media/ayuda/familia-revisar.webm',
  idiomaTema: '/media/ayuda/idioma-tema.webm',
  movil: '/media/ayuda/movil.webm',
};

// Cada vídeo tiene al lado su portada, con el mismo nombre en .jpg.
export function portadaDe(video: IdVideoAyuda) {
  return ARCHIVO_VIDEO[video].replace(/\.webm$/, '.jpg');
}

interface ConfigTema {
  id: IdTemaAyuda;
  // Pantallas cuyo botón «?» abre este tema.
  rutas: string[];
  videos: IdVideoAyuda[];
  soloModoEscolar?: boolean;
}

// En el orden en que salen en la página de Ayuda.
export const TEMAS_AYUDA: ConfigTema[] = [
  { id: 'primerosPasos', rutas: ['/'], videos: [] },
  { id: 'tareas', rutas: ['/kanban', '/eisenhower', '/objetivos', '/notas', '/etiquetas'], videos: [] },
  { id: 'agenda', rutas: ['/agenda'], videos: ['agenda'] },
  { id: 'horario', rutas: ['/horario'], videos: ['horarioFoto'], soloModoEscolar: true },
  {
    id: 'planificador',
    rutas: ['/planificador'],
    videos: ['examenesFoto', 'deberesFoto'],
    soloModoEscolar: true,
  },
  { id: 'ia', rutas: [], videos: ['planEstudio'] },
  { id: 'pomodoro', rutas: ['/pomodoro', '/estadisticas'], videos: ['pomodoroEstadisticas'] },
  { id: 'revision', rutas: ['/revision', '/recordatorios'], videos: [] },
  { id: 'familia', rutas: ['/familia'], videos: ['familiaPedirRevision', 'familiaRevisar'] },
  { id: 'ajustes', rutas: ['/ajustes'], videos: ['idiomaTema', 'movil'] },
];

// Ancla de cada tema en la página de Ayuda (/ayuda#ayuda-<tema>).
export function idAncla(tema: IdTemaAyuda) {
  return `ayuda-${tema}`;
}

export function temaDeRuta(ruta: string): IdTemaAyuda | null {
  return TEMAS_AYUDA.find((tema) => tema.rutas.includes(ruta))?.id ?? null;
}
