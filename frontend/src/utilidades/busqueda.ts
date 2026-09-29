import type { Etiqueta } from '@/servicios/etiquetas';
import type { Nota } from '@/servicios/notas';
import type { Objetivo } from '@/servicios/objetivos';
import type { Tarea } from '@/servicios/tareas';
import { rutaEtiqueta } from './etiquetas';

export const LONGITUD_MINIMA_BUSQUEDA = 2;
const RESULTADOS_POR_GRUPO = 8;
const LONGITUD_EXTRACTO = 90;

// Sin mayúsculas ni tildes: "matematicas" encuentra "Matemáticas".
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function palabras(consulta: string) {
  return normalizar(consulta).split(/\s+/).filter(Boolean);
}

// Todas las palabras de la consulta tienen que aparecer, en cualquier orden y
// repartidas entre los textos de un mismo elemento.
function coincide(terminos: string[], textos: (string | null | undefined)[]) {
  const juntos = normalizar(textos.filter(Boolean).join('\n'));
  return terminos.every((termino) => juntos.includes(termino));
}

// Trozo de un texto largo alrededor de la primera palabra encontrada.
export function extracto(texto: string, consulta: string) {
  const plano = texto.replace(/\s+/g, ' ').trim();
  if (plano.length <= LONGITUD_EXTRACTO) return plano;
  const posiciones = palabras(consulta)
    .map((palabra) => normalizar(plano).indexOf(palabra))
    .filter((posicion) => posicion >= 0);
  const inicio = Math.max(0, (posiciones.length ? Math.min(...posiciones) : 0) - 30);
  const fin = inicio + LONGITUD_EXTRACTO;
  return `${inicio > 0 ? '…' : ''}${plano.slice(inicio, fin)}${fin < plano.length ? '…' : ''}`;
}

export interface ResultadoTarea {
  tarea: Tarea;
  // Si no coincide el título, de dónde sale la coincidencia.
  subtarea: string | null;
  descripcion: string | null;
}

export interface ResultadosBusqueda {
  tareas: ResultadoTarea[];
  objetivos: Objetivo[];
  notas: Nota[];
  etiquetas: { etiqueta: Etiqueta; ruta: string }[];
  total: number;
}

export function buscar(
  consulta: string,
  datos: { tareas: Tarea[]; objetivos: Objetivo[]; notas: Nota[]; etiquetas: Etiqueta[] },
): ResultadosBusqueda {
  const terminos = palabras(consulta);
  if (terminos.join(' ').length < LONGITUD_MINIMA_BUSQUEDA) {
    return { tareas: [], objetivos: [], notas: [], etiquetas: [], total: 0 };
  }

  const tareas = datos.tareas
    .filter((tarea) =>
      coincide(terminos, [tarea.titulo, tarea.descripcion, ...tarea.subtareas.map((s) => s.titulo)]),
    )
    .map((tarea): ResultadoTarea => {
      if (coincide(terminos, [tarea.titulo])) return { tarea, subtarea: null, descripcion: null };
      const subtarea = tarea.subtareas.find((s) => coincide(terminos, [s.titulo]))?.titulo ?? null;
      return {
        tarea,
        subtarea,
        descripcion: !subtarea && tarea.descripcion ? extracto(tarea.descripcion, consulta) : null,
      };
    })
    // Primero las que coinciden en el título: suelen ser lo que se busca.
    .sort(
      (a, b) =>
        Number(a.subtarea !== null || a.descripcion !== null) -
        Number(b.subtarea !== null || b.descripcion !== null),
    );

  const objetivos = datos.objetivos.filter((objetivo) =>
    coincide(terminos, [objetivo.titulo, objetivo.descripcion]),
  );
  const notas = datos.notas.filter((nota) => coincide(terminos, [nota.contenido]));
  // Una etiqueta también se encuentra por el nombre de sus antecesoras
  // ("estudio mates" → Estudio › Matemáticas).
  const etiquetas = datos.etiquetas
    .map((etiqueta) => ({ etiqueta, ruta: rutaEtiqueta(datos.etiquetas, etiqueta.id) }))
    .filter(({ ruta }) => coincide(terminos, [ruta]))
    .sort((a, b) => a.ruta.localeCompare(b.ruta));

  return {
    tareas: tareas.slice(0, RESULTADOS_POR_GRUPO),
    objetivos: objetivos.slice(0, RESULTADOS_POR_GRUPO),
    notas: notas.slice(0, RESULTADOS_POR_GRUPO),
    etiquetas: etiquetas.slice(0, RESULTADOS_POR_GRUPO),
    total: tareas.length + objetivos.length + notas.length + etiquetas.length,
  };
}
