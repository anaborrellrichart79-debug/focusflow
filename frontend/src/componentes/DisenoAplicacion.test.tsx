import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { DisenoAplicacion } from './DisenoAplicacion';

describe('DisenoAplicacion', () => {
  it('con la cuenta confirmada, muestra la barra lateral y el contenido de la página', () => {
    renderizarPagina(
      <DisenoAplicacion>
        <p>Contenido de la página</p>
      </DisenoAplicacion>,
      { estadoPrecargado: { sesion: SESION_AUTENTICADA } },
    );

    expect(screen.getByText('Contenido de la página')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  });

  it('con la cuenta de un menor sin confirmar, muestra la pantalla de pendiente en vez de la página', () => {
    renderizarPagina(
      <DisenoAplicacion>
        <p>Contenido de la página</p>
      </DisenoAplicacion>,
      {
        estadoPrecargado: {
          sesion: {
            ...SESION_AUTENTICADA,
            usuario: { ...SESION_AUTENTICADA.usuario!, consentimientoConfirmado: false },
          },
        },
      },
    );

    expect(screen.getByText('Tu cuenta está pendiente de confirmación')).toBeInTheDocument();
    expect(screen.queryByText('Contenido de la página')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('el botón de menú del móvil abre y cierra el cajón', async () => {
    const usuario = userEvent.setup();
    renderizarPagina(
      <DisenoAplicacion>
        <p>Contenido</p>
      </DisenoAplicacion>,
      { estadoPrecargado: { sesion: SESION_AUTENTICADA } },
    );

    const boton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    await usuario.click(boton);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // Elegir una sección cierra el cajón.
    await usuario.click(screen.getByRole('link', { name: 'Kanban' }));
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });
});
