import type { CodigoIdioma } from '@/idiomas';
import { ca } from './ca';
import { en } from './en';
import { es } from './es';
import { eu } from './eu';
import { gl } from './gl';
import type { TextosLegales } from './tipos';
import { va } from './va';

export { FECHA_TEXTOS_LEGALES } from './tipos';
export type { Bloque, DocumentoLegal } from './tipos';

export const TEXTOS_LEGALES: Record<CodigoIdioma, TextosLegales> = { es, va, gl, eu, ca, en };
