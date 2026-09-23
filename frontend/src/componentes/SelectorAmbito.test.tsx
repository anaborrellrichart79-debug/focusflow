import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import { SelectorAmbito } from './SelectorAmbito';

describe('SelectorAmbito', () => {
  it('marca "Todo" por defecto y cambia el ámbito activo al pulsar otra opción', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizarPagina(<SelectorAmbito />, {
      estadoPrecargado: { sesion: SESION_MODO_ESCOLAR },
    });

    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true');

    await usuario.click(screen.getByRole('button', { name: 'Escolar' }));

    expect(tienda.getState().interfaz.ambitoActivo).toBe('ESCOLAR');
    expect(screen.getByRole('button', { name: 'Escolar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sin el modo escolar ofrece Todo, Personal y Eventual', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizarPagina(<SelectorAmbito />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.getAllByRole('button').map((boton) => boton.textContent)).toEqual([
      'Todo',
      'Personal',
      'Eventual',
    ]);
    await usuario.click(screen.getByRole('button', { name: 'Eventual' }));
    expect(tienda.getState().interfaz.ambitoActivo).toBe('EVENTUAL');
  });
});
