import { IDIOMA_POR_DEFECTO, mensajesPorIdioma, type CodigoIdioma } from '@/idiomas';

export const URL_BASE_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ErrorApi extends Error {
  readonly estado: number;
  // Código del catálogo del backend (src/comun/errores.ts), si lo trae.
  readonly codigo: string | null;

  constructor(message: string, estado: number, codigo: string | null = null) {
    super(message);
    this.estado = estado;
    this.codigo = codigo;
  }
}

// Idioma en el que se traducen los errores de la API. Lo mantiene al día
// Aplicacion al cambiar de idioma: así todos los mensajes de error que ya se
// enseñan en las pantallas salen traducidos sin tocar cada una.
let idiomaErrores: CodigoIdioma = IDIOMA_POR_DEFECTO;

export function establecerIdiomaErrores(idioma: CodigoIdioma) {
  idiomaErrores = idioma;
}

export function traducirError(codigo: string | null | undefined): string | undefined {
  return codigo ? mensajesPorIdioma[idiomaErrores][`error.${codigo}`] : undefined;
}

// El backend manda { message, codigo } o, en los errores de validación,
// { message: [...], codigos: [...] } alineados. Lo que no tiene traducción se
// enseña con el texto del servidor.
function mensajeDeError(cuerpo: Record<string, unknown> | null, estado: number) {
  const mensajes = Array.isArray(cuerpo?.message) ? (cuerpo.message as unknown[]) : [cuerpo?.message];
  const codigos = Array.isArray(cuerpo?.codigos)
    ? (cuerpo.codigos as (string | null)[])
    : [(cuerpo?.codigo as string | undefined) ?? null];

  if (estado >= 500 && !cuerpo?.codigo) {
    return traducirError('ERROR_INTERNO') ?? 'Ha ocurrido un error en el servidor';
  }
  const textos = mensajes
    .map((mensaje, indice) => traducirError(codigos[indice]) ?? (typeof mensaje === 'string' ? mensaje : null))
    .filter((texto): texto is string => Boolean(texto));
  return textos.length > 0
    ? textos.join(', ')
    : (traducirError('ERROR_DESCONOCIDO') ?? 'Ha ocurrido un error inesperado');
}

export async function peticionApi<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers,
      },
    });
  } catch {
    // Servidor apagado, sin conexión, CORS...: fetch no llega a responder.
    throw new ErrorApi(traducirError('SIN_CONEXION') ?? 'No se pudo conectar con el servidor', 0, 'SIN_CONEXION');
  }

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorApi(
      mensajeDeError(cuerpo, respuesta.status),
      respuesta.status,
      (cuerpo?.codigo as string | undefined) ?? null,
    );
  }

  return cuerpo as T;
}
