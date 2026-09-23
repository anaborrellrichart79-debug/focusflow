import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PaginaAjustes } from './PaginaAjustes';

describe('PaginaAjustes', () => {
  it('sin cuenta de Google conectada, muestra el botón de conectar', () => {
    renderizarPagina(<PaginaAjustes />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.getByText('No conectado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conectar con Google' })).toBeInTheDocument();
  });

  it('con cuenta conectada, muestra sincronizar/desconectar y la última sincronización', () => {
    renderizarPagina(<PaginaAjustes />, {
      estadoPrecargado: {
        sesion: SESION_AUTENTICADA,
        google: {
          conectado: true,
          ultimaSincronizacion: '2026-09-21T18:00:00.000Z',
          sincronizando: false,
          cargandoEstado: false,
          ultimoResumen: null,
          error: null,
        },
      },
    });

    expect(screen.getByText('Cuenta conectada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar ahora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desconectar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conectar con Google' })).not.toBeInTheDocument();
  });

  it('tras volver del callback de Google con éxito, muestra el mensaje de confirmación', () => {
    renderizarPagina(<PaginaAjustes />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/ajustes?google=conectado',
    });

    expect(screen.getByText('Cuenta de Google conectada correctamente.')).toBeInTheDocument();
  });

  it('tras volver del callback de Google con error, muestra el mensaje de fallo', () => {
    renderizarPagina(<PaginaAjustes />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/ajustes?google=error',
    });

    expect(screen.getByText('No se pudo completar la conexión con Google.')).toBeInTheDocument();
  });

  describe('modo escolar', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('activarlo guarda la preferencia en el servidor y actualiza la sesión', async () => {
      const usuario = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, opciones?: RequestInit) => {
          if (url.endsWith('/autenticacion/preferencias')) {
            return {
              ok: true,
              json: async () => ({
                ...SESION_AUTENTICADA.usuario,
                ...JSON.parse(opciones!.body as string),
              }),
            } as Response;
          }
          return { ok: true, json: async () => ({ conectado: false }) } as Response;
        }),
      );

      const { tienda } = renderizarPagina(<PaginaAjustes />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });

      const casilla = screen.getByRole('checkbox', { name: 'Activar el modo escolar' });
      expect(casilla).not.toBeChecked();

      await usuario.click(casilla);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/autenticacion/preferencias',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ modoEscolarActivo: true }),
        }),
      );
      expect(tienda.getState().sesion.usuario?.modoEscolarActivo).toBe(true);
      expect(await screen.findByRole('checkbox', { name: 'Activar el modo escolar' })).toBeChecked();
    });
  });

  describe('perfil', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('sin elegir, marca los sugeridos; marcar otro los guarda como elegidos', async () => {
      const usuario = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, opciones?: RequestInit) => ({
          ok: true,
          json: async () =>
            url.endsWith('/autenticacion/preferencias')
              ? { ...SESION_AUTENTICADA.usuario, ...JSON.parse(opciones!.body as string) }
              : { conectado: false },
        })),
      );

      const { tienda } = renderizarPagina(<PaginaAjustes />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });

      expect(screen.getByRole('checkbox', { name: 'Profesional' })).toBeChecked();
      expect(screen.getByText(/perfiles que sugiere la app/)).toBeInTheDocument();

      await usuario.click(screen.getByRole('checkbox', { name: 'Padre o madre' }));

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/autenticacion/preferencias',
        expect.objectContaining({ body: JSON.stringify({ perfiles: ['PROFESIONAL', 'PADRE'] }) }),
      );
      await vi.waitFor(() =>
        expect(tienda.getState().sesion.usuario?.perfiles).toEqual(['PROFESIONAL', 'PADRE']),
      );
      expect(screen.queryByText(/perfiles que sugiere la app/)).not.toBeInTheDocument();
    });
  });
});
