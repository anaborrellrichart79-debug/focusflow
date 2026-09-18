import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import interfazReducer from '@/almacen/interfazSlice';
import { es } from '@/idiomas/es';
import { SelectorTema } from './SelectorTema';

function renderizarConTienda() {
  const tienda = configureStore({ reducer: { interfaz: interfazReducer } });
  render(
    <Provider store={tienda}>
      <IntlProvider locale="es" messages={es}>
        <SelectorTema />
      </IntlProvider>
    </Provider>,
  );
  return tienda;
}

describe('SelectorTema', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('empieza en modo claro mostrando el botón para activar el modo oscuro', () => {
    renderizarConTienda();
    const boton = screen.getByRole('button', { name: 'Activar modo oscuro' });
    expect(boton).toHaveAttribute('aria-pressed', 'false');
  });

  it('al pulsarlo cambia al modo oscuro y actualiza el estado y la etiqueta', async () => {
    const usuario = userEvent.setup();
    const tienda = renderizarConTienda();

    await usuario.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(tienda.getState().interfaz.tema).toBe('oscuro');
    const boton = screen.getByRole('button', { name: 'Activar modo claro' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
  });
});
