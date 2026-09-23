import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { SelectorAmbito } from './SelectorAmbito';

describe('SelectorAmbito', () => {
  it('marca "Todo" por defecto y cambia el ámbito activo al pulsar otra opción', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizarPagina(<SelectorAmbito />);

    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true');

    await usuario.click(screen.getByRole('button', { name: 'Escolar' }));

    expect(tienda.getState().interfaz.ambitoActivo).toBe('ESCOLAR');
    expect(screen.getByRole('button', { name: 'Escolar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'false');
  });
});
