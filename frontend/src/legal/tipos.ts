// Textos legales (política de privacidad y condiciones del servicio), uno por
// idioma. La versión en castellano es la de referencia: si una traducción
// dice otra cosa, vale la castellana (lo avisa la propia página).

// Un bloque es un párrafo o una lista de puntos.
export type Bloque = string | { lista: string[] };

export interface Seccion {
  titulo: string;
  bloques: Bloque[];
}

export interface DocumentoLegal {
  titulo: string;
  secciones: Seccion[];
}

export interface TextosLegales {
  privacidad: DocumentoLegal;
  condiciones: DocumentoLegal;
}

// Fecha de la última versión: se enseña arriba de las dos páginas.
export const FECHA_TEXTOS_LEGALES = '2026-10-02';
