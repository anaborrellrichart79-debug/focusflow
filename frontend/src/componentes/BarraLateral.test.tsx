import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { BarraLateral } from './BarraLateral';

describe('BarraLateral', () => {
  it('agrupa los enlaces por secciones y apunta a cada página', () => {
    renderizarPagina(<BarraLateral />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const navegacion = within(screen.getByRole('navigation', { name: 'Navegación principal' }));
    expect(navegacion.getByText('Planificar')).toBeInTheDocument();
    expect(navegacion.getByText('Concentrarse')).toBeInTheDocument();
    expect(navegacion.getByText('Revisar')).toBeInTheDocument();
    expect(navegacion.getByRole('link', { name: 'Kanban' })).toHaveAttribute('href', '/kanban');
    expect(navegacion.getByRole('link', { name: 'Pomodoro' })).toHaveAttribute('href', '/pomodoro');
    expect(screen.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('href', '/ajustes');
  });

  it('marca como actual solo el enlace de la página abierta', () => {
    renderizarPagina(<BarraLateral />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
      ruta: '/agenda',
    });

    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page');
    // "Inicio" (/) no debe quedar marcado en cualquier ruta: por eso los NavLink llevan `end`.
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('incluye el selector de ámbito y muestra el nombre del usuario', () => {
    renderizarPagina(<BarraLateral />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.getByRole('group', { name: 'Ámbito' })).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('cerrar sesión limpia el estado de la sesión', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizarPagina(<BarraLateral />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(tienda.getState().sesion.usuario).toBeNull();
    expect(tienda.getState().sesion.tokenAcceso).toBeNull();
  });
});
