import { ca } from './ca';
import { en } from './en';
import { es } from './es';
import { eu } from './eu';
import { gl } from './gl';
import { va } from './va';

export type CodigoIdioma = 'es' | 'va' | 'gl' | 'eu' | 'ca' | 'en';

export const IDIOMA_POR_DEFECTO: CodigoIdioma = 'es';

export const IDIOMAS_DISPONIBLES: { codigo: CodigoIdioma; etiqueta: string }[] = [
  { codigo: 'es', etiqueta: 'Castellano' },
  { codigo: 'va', etiqueta: 'Valencià' },
  { codigo: 'gl', etiqueta: 'Galego' },
  { codigo: 'eu', etiqueta: 'Euskara' },
  { codigo: 'ca', etiqueta: 'Català' },
  { codigo: 'en', etiqueta: 'English' },
];

export const mensajesPorIdioma: Record<CodigoIdioma, Record<string, string>> = {
  es,
  va,
  gl,
  eu,
  ca,
  en,
};
