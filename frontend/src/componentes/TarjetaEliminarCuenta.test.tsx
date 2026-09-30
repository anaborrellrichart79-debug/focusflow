import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { TarjetaEliminarCuenta } from './TarjetaEliminarCuenta';

describe('TarjetaEliminarCuenta', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide la contraseña y, con la equivocada, avisa sin cerrar la sesión', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'La contraseña no es correcta', codigo: 'CONTRASENA_INCORRECTA' }),
      } as Response),
    );
    const { tienda } = renderizarPagina(<TarjetaEliminarCuenta />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await usuario.type(screen.getByLabelText('Escribe tu contraseña para confirmarlo'), 'Otra1234');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña no es correcta');
    expect(tienda.getState().sesion.tokenAcceso).toBe(SESION_AUTENTICADA.tokenAcceso);
  });

  it('con la contraseña buena borra la cuenta y cierra la sesión', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response);
    vi.stubGlobal('fetch', fetchFalso);
    const { tienda } = renderizarPagina(<TarjetaEliminarCuenta />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await usuario.type(screen.getByLabelText('Escribe tu contraseña para confirmarlo'), 'Correcta1');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    await waitFor(() => expect(tienda.getState().sesion.tokenAcceso).toBeNull());
    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/cuenta',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ contrasena: 'Correcta1' }) }),
    );
  });
});
