import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaLogin } from './PaginaLogin';

function renderizarConRutas() {
  return renderizarPagina(
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />
      <Route path="/" element={<p>Marcador de inicio</p>} />
    </Routes>,
    { ruta: '/login' },
  );
}

describe('PaginaLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con credenciales correctas, inicia sesión y navega a la portada', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenAcceso: 'token-de-prueba',
        usuario: { id: 'usuario-1', correo: 'ana@example.com', nombre: 'Ana' },
      }),
    } as Response);

    const usuario = userEvent.setup();
    const { tienda } = renderizarConRutas();

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Abcdefg1');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Marcador de inicio')).toBeInTheDocument();
    expect(tienda.getState().sesion.tokenAcceso).toBe('token-de-prueba');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/autenticacion/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('con credenciales incorrectas, muestra el error y no navega', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Correo o contraseña incorrectos' }),
    } as Response);

    const usuario = userEvent.setup();
    renderizarConRutas();

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'contrasena-mala');
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
    expect(screen.queryByText('Marcador de inicio')).not.toBeInTheDocument();
  });
});
