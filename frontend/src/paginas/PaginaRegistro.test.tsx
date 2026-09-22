import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaRegistro } from './PaginaRegistro';

const FECHA_NACIMIENTO_ADULTA = '1990-01-01';
const FECHA_NACIMIENTO_MENOR = '2015-01-01';

function renderizarConRutas() {
  return renderizarPagina(
    <Routes>
      <Route path="/registro" element={<PaginaRegistro />} />
      <Route path="/" element={<p>Marcador de inicio</p>} />
    </Routes>,
    { ruta: '/registro' },
  );
}

describe('PaginaRegistro', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con datos válidos, registra el usuario y navega a la portada', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenAcceso: 'token-de-prueba',
        usuario: {
          id: 'usuario-1',
          correo: 'nueva@example.com',
          nombre: null,
          consentimientoConfirmado: true,
          modoEscolarActivo: false,
        },
      }),
    } as Response);

    const usuario = userEvent.setup();
    const { tienda } = renderizarConRutas();

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'nueva@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Abcdefg1');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: FECHA_NACIMIENTO_ADULTA },
    });
    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(await screen.findByText('Marcador de inicio')).toBeInTheDocument();
    expect(tienda.getState().sesion.tokenAcceso).toBe('token-de-prueba');

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    const cuerpoEnviado = JSON.parse(opciones!.body as string);
    expect(cuerpoEnviado).toEqual({
      correo: 'nueva@example.com',
      contrasena: 'Abcdefg1',
      fechaNacimiento: FECHA_NACIMIENTO_ADULTA,
    });
    expect(cuerpoEnviado).not.toHaveProperty('nombre');
    expect(cuerpoEnviado).not.toHaveProperty('correoTutor');
  });

  it('si se rellena el nombre, se envía en la petición de registro', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenAcceso: 'token-de-prueba',
        usuario: {
          id: 'usuario-1',
          correo: 'nueva@example.com',
          nombre: 'Ana',
          consentimientoConfirmado: true,
          modoEscolarActivo: false,
        },
      }),
    } as Response);

    const usuario = userEvent.setup();
    renderizarConRutas();

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Correo electrónico'), 'nueva@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Abcdefg1');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: FECHA_NACIMIENTO_ADULTA },
    });
    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    await screen.findByText('Marcador de inicio');

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    const cuerpoEnviado = JSON.parse(opciones!.body as string);
    expect(cuerpoEnviado.nombre).toBe('Ana');
  });

  it('si el correo ya existe, muestra el error y no navega', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Ya existe un usuario con ese correo' }),
    } as Response);

    const usuario = userEvent.setup();
    renderizarConRutas();

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Abcdefg1');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: FECHA_NACIMIENTO_ADULTA },
    });
    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(await screen.findByText('Ya existe un usuario con ese correo')).toBeInTheDocument();
    expect(screen.queryByText('Marcador de inicio')).not.toBeInTheDocument();
  });

  it('si la fecha de nacimiento implica ser menor de edad, pide el correo del tutor y lo envía', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenAcceso: 'token-de-prueba',
        usuario: {
          id: 'usuario-menor',
          correo: 'menor@example.com',
          nombre: null,
          consentimientoConfirmado: false,
          modoEscolarActivo: false,
        },
      }),
    } as Response);

    const usuario = userEvent.setup();
    renderizarConRutas();

    expect(screen.queryByLabelText(/tutor/i)).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Correo electrónico'), 'menor@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Abcdefg1');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: FECHA_NACIMIENTO_MENOR },
    });

    const campoTutor = await screen.findByLabelText(/tutor/i);
    await usuario.type(campoTutor, 'tutor@example.com');
    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    await screen.findByText('Marcador de inicio');

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    const cuerpoEnviado = JSON.parse(opciones!.body as string);
    expect(cuerpoEnviado.fechaNacimiento).toBe(FECHA_NACIMIENTO_MENOR);
    expect(cuerpoEnviado.correoTutor).toBe('tutor@example.com');
  });
});
