import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_E2E } from './entorno';

export const CONTRASENA = 'Prueba123';
export const NACIMIENTO_ADULTO = '1985-03-14';
export const NACIMIENTO_MENOR = '2015-05-01';

// Correo distinto en cada ejecución (la base de datos se vacía al empezar,
// pero así un test repetido a mano tampoco choca con otro anterior).
export function correoUnico(nombre: string) {
  return `${nombre}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
}

interface Registro {
  tokenAcceso: string;
  usuario: { id: string; nombre: string | null; correo: string };
}

// Preparar datos por la API es más rápido y estable que por la interfaz;
// la interfaz se reserva para lo que cada test quiere comprobar.
export async function registrarPorApi(
  request: APIRequestContext,
  datos: { nombre: string; fechaNacimiento?: string; correoTutor?: string },
): Promise<Registro> {
  const respuesta = await request.post(`${API_E2E}/autenticacion/registro`, {
    data: {
      correo: correoUnico(datos.nombre.toLowerCase()),
      contrasena: CONTRASENA,
      nombre: datos.nombre,
      fechaNacimiento: datos.fechaNacimiento ?? NACIMIENTO_ADULTO,
      correoTutor: datos.correoTutor,
    },
  });
  expect(respuesta.ok(), await respuesta.text()).toBe(true);
  return respuesta.json();
}

export async function llamarApi(
  request: APIRequestContext,
  token: string,
  metodo: 'get' | 'post' | 'patch',
  ruta: string,
  datos?: unknown,
) {
  const respuesta = await request[metodo](`${API_E2E}${ruta}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: datos,
  });
  expect(respuesta.ok(), await respuesta.text()).toBe(true);
  return respuesta.json();
}

// Entra en la app con una sesión ya iniciada (token en localStorage, igual
// que tras hacer login).
export async function entrarComo(page: Page, token: string, ruta = '/') {
  await page.addInitScript((valor) => localStorage.setItem('focusflow.tokenAcceso', valor), token);
  await page.goto(ruta);
}

export async function tokenDe(page: Page) {
  return page.evaluate(() => localStorage.getItem('focusflow.tokenAcceso'));
}
