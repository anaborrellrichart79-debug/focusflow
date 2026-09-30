import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaLegal } from './PaginaLegal';

describe('PaginaLegal', () => {
  it('la política de privacidad dice quién es la responsable, sin sesión y en castellano', () => {
    renderizarPagina(<PaginaLegal documento="privacidad" />, { ruta: '/privacidad' });

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeInTheDocument();
    expect(screen.getAllByText(/Ana Borrell Richart, NIF 21673526M/)[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '7. Datos de Google' })).toBeInTheDocument();
    // En castellano no hace falta el aviso de "esto es una traducción".
    expect(screen.queryByText(/Esta es una traducción/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Condiciones del servicio' })).toHaveAttribute('href', '/condiciones');
  });

  it('en otro idioma enseña la traducción y avisa de que vale la versión en castellano', () => {
    renderizarPagina(<PaginaLegal documento="condiciones" />, {
      ruta: '/condiciones',
      estadoPrecargado: { interfaz: { idioma: 'en', tema: 'claro', ambitoActivo: 'PERSONAL' } } as never,
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of service' })).toBeInTheDocument();
    expect(screen.getByText('Esta es una traducción. Si hubiera alguna diferencia, vale la versión en castellano.')).toBeInTheDocument();
  });
});
