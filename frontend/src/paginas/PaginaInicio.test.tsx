import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PaginaInicio } from './PaginaInicio';

describe('PaginaInicio', () => {
  it('sin sesión, muestra los enlaces de iniciar sesión y crear cuenta', () => {
    renderizarPagina(<PaginaInicio />);

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });

  it('con sesión, saluda al usuario y cerrar sesión limpia el estado', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizarPagina(<PaginaInicio />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.getByText('Hola, Ana')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(tienda.getState().sesion.usuario).toBeNull();
    expect(tienda.getState().sesion.tokenAcceso).toBeNull();
  });
});
