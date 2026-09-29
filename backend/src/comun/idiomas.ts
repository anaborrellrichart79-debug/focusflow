// Idiomas de la interfaz (los mismos códigos que frontend/src/idiomas). Se
// guardan en Usuario.idioma para redactar en el idioma de cada uno lo que
// escribe el servidor: avisos push, correos y el texto de Ollama.
export const IDIOMAS = ['es', 'va', 'gl', 'eu', 'ca', 'en'] as const;

export type Idioma = (typeof IDIOMAS)[number];

export function comoIdioma(valor: string | null | undefined): Idioma {
  return (IDIOMAS as readonly string[]).includes(valor ?? '') ? (valor as Idioma) : 'es';
}

// Para las instrucciones a Ollama ("Escribe en ...").
export const NOMBRE_IDIOMA_PARA_IA: Record<Idioma, string> = {
  es: 'castellano',
  va: 'valenciano',
  gl: 'gallego',
  eu: 'euskera',
  ca: 'catalán',
  en: 'inglés',
};
