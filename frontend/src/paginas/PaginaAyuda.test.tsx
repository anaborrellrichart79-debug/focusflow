import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PaginaAyuda } from './PaginaAyuda';

describe('PaginaAyuda', () => {
  it('enseña todos los temas con un índice, y los vídeos con su descripción', () => {
    renderizarPagina(<PaginaAyuda />, { ruta: '/ayuda', estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.getByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument();
    const indice = screen.getByRole('navigation', { name: 'Temas de la ayuda' });
    expect(indice.querySelectorAll('a')).toHaveLength(10);
    expect(screen.getByRole('link', { name: 'Familia' })).toHaveAttribute('href', '#ayuda-familia');
    expect(screen.getByRole('heading', { level: 2, name: /Horario de clase/ })).toBeInTheDocument();

    const video = screen.getByLabelText(/Foto de un calendario de exámenes escrito a mano/);
    expect(video).toHaveAttribute('src', '/media/ayuda/examenes-foto.webm');
  });

  it('marca los temas que necesitan el modo escolar', () => {
    renderizarPagina(<PaginaAyuda />, { ruta: '/ayuda', estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    expect(screen.getAllByText('Modo escolar')).toHaveLength(2);
  });
});
