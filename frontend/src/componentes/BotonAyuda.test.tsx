import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { BotonAyuda } from './BotonAyuda';

describe('BotonAyuda', () => {
  it('abre la ayuda de la pantalla en la que se está, con enlace a la ayuda completa', async () => {
    const usuario = userEvent.setup();
    renderizarPagina(<BotonAyuda />, { ruta: '/kanban', estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.click(screen.getByRole('button', { name: 'Ayuda de esta pantalla' }));

    const ventana = screen.getByRole('dialog', { name: 'Organizar tus tareas' });
    expect(ventana).toHaveTextContent(/Kanban: cada columna es un estado/);
    expect(screen.getByRole('link', { name: 'Ver toda la ayuda' })).toHaveAttribute('href', '/ayuda#ayuda-tareas');
  });

  it('no sale en la propia página de Ayuda', () => {
    renderizarPagina(<BotonAyuda />, { ruta: '/ayuda', estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.queryByRole('button', { name: 'Ayuda de esta pantalla' })).not.toBeInTheDocument();
  });
});
