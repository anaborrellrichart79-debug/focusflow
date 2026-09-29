import { afterEach, describe, expect, it } from 'vitest';
import { crearTiendaDePrueba, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Tarea } from '@/servicios/tareas';
import { cambiarIdioma } from './interfazSlice';
import { cerrarSesion, iniciarSesionUsuario } from './sesionSlice';

const TAREA_DEL_ADULTO = { id: 'tarea-ana', titulo: 'Declaración de la renta' } as Tarea;

function tiendaConDatosDeAna() {
  return crearTiendaDePrueba({
    sesion: SESION_AUTENTICADA,
    tareas: { lista: [TAREA_DEL_ADULTO], cargando: false, error: null },
  });
}

describe('reductorRaiz', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('al cerrar sesión no quedan en memoria las tareas de la cuenta anterior', () => {
    const tienda = tiendaConDatosDeAna();

    tienda.dispatch(cerrarSesion());

    expect(tienda.getState().tareas.lista).toEqual([]);
  });

  it('al entrar con otra cuenta sin cerrar sesión antes, tampoco', () => {
    const tienda = tiendaConDatosDeAna();

    tienda.dispatch(
      iniciarSesionUsuario.fulfilled(
        {
          usuario: { ...SESION_AUTENTICADA.usuario!, id: 'sofia', correo: 'sofia@example.com' },
          tokenAcceso: 'token-de-sofia',
        },
        'peticion-1',
        { correo: 'sofia@example.com', contrasena: 'Abcdefg1' },
      ),
    );

    expect(tienda.getState().tareas.lista).toEqual([]);
    expect(tienda.getState().sesion.usuario?.id).toBe('sofia');
  });

  it('las preferencias de la interfaz sobreviven al cambio de cuenta', () => {
    const tienda = tiendaConDatosDeAna();
    tienda.dispatch(cambiarIdioma('en'));

    tienda.dispatch(cerrarSesion());

    expect(tienda.getState().interfaz.idioma).toBe('en');
  });
});
