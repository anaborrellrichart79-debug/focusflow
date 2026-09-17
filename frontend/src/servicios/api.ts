export const URL_BASE_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ErrorApi extends Error {
  readonly estado: number;

  constructor(message: string, estado: number) {
    super(message);
    this.estado = estado;
  }
}

export async function peticionApi<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
  });

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join(', ')
      : (cuerpo?.message ?? 'Ha ocurrido un error inesperado');
    throw new ErrorApi(mensaje, respuesta.status);
  }

  return cuerpo as T;
}
