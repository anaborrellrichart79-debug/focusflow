import type { Etiqueta } from '@/servicios/etiquetas';

// Igual que MAXIMO_NIVELES_ETIQUETA en el backend (etiquetas.service.ts).
export const MAXIMO_NIVELES_ETIQUETA = 3;

export interface NodoEtiqueta {
  etiqueta: Etiqueta;
  nivel: number; // 1 = primer nivel
}

// Árbol aplanado en orden de lectura: cada etiqueta seguida de las suyas,
// alfabético dentro de cada nivel. Sirve para listas y desplegables sangrados.
export function aplanarArbol(etiquetas: Etiqueta[]): NodoEtiqueta[] {
  const ids = new Set(etiquetas.map((e) => e.id));
  const hijasDe = (padreId: string | null) =>
    etiquetas
      .filter((e) => (e.padreId && ids.has(e.padreId) ? e.padreId : null) === padreId)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const resultado: NodoEtiqueta[] = [];
  const recorrer = (padreId: string | null, nivel: number) => {
    for (const etiqueta of hijasDe(padreId)) {
      resultado.push({ etiqueta, nivel });
      recorrer(etiqueta.id, nivel + 1);
    }
  };
  recorrer(null, 1);
  return resultado;
}

// "Matemáticas › Cálculo"
export function rutaEtiqueta(etiquetas: Etiqueta[], id: string): string {
  const porId = new Map(etiquetas.map((e) => [e.id, e]));
  const partes: string[] = [];
  let actual = porId.get(id);
  while (actual && partes.length <= MAXIMO_NIVELES_ETIQUETA) {
    partes.unshift(actual.nombre);
    actual = actual.padreId ? porId.get(actual.padreId) : undefined;
  }
  return partes.join(' › ');
}

// La etiqueta y todas las que cuelgan de ella: filtrar por "Matemáticas"
// incluye también "Cálculo".
export function idsConDescendientes(etiquetas: Etiqueta[], id: string): Set<string> {
  const resultado = new Set([id]);
  let anadida = true;
  while (anadida) {
    anadida = false;
    for (const etiqueta of etiquetas) {
      if (etiqueta.padreId && resultado.has(etiqueta.padreId) && !resultado.has(etiqueta.id)) {
        resultado.add(etiqueta.id);
        anadida = true;
      }
    }
  }
  return resultado;
}

function altura(etiquetas: Etiqueta[], id: string): number {
  const hijas = etiquetas.filter((e) => e.padreId === id);
  return 1 + Math.max(0, ...hijas.map((hija) => altura(etiquetas, hija.id)));
}

// Etiquetas dentro de las que se puede colocar "id" (con todo lo suyo) sin
// pasar de 3 niveles ni meterla dentro de sí misma. Sin id: para una nueva.
export function padresPosibles(etiquetas: Etiqueta[], id?: string): NodoEtiqueta[] {
  const alto = id ? altura(etiquetas, id) : 1;
  const excluidas = id ? idsConDescendientes(etiquetas, id) : new Set<string>();
  return aplanarArbol(etiquetas).filter(
    (nodo) => !excluidas.has(nodo.etiqueta.id) && nodo.nivel + alto <= MAXIMO_NIVELES_ETIQUETA,
  );
}
