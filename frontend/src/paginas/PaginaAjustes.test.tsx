import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
