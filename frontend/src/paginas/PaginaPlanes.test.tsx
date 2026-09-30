import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaPlanes } from './PaginaPlanes';

describe('PaginaPlanes', () => {
  it('sin sesión, enseña los dos planes con el precio (IVA incluido) y cómo funcionan el pago y la baja', () => {
    renderizarPagina(<PaginaPlanes />, { ruta: '/planes' });

    expect(screen.getByRole('heading', { level: 1, name: 'Planes y precios' })).toBeInTheDocument();
    expect(screen.getByText('Gratis, para siempre')).toBeInTheDocument();
    expect(screen.getByText(/3,99\s€ al mes/)).toBeInTheDocument();
    expect(screen.getByText(/29,99\s€ al año \(sale a 2,50\s€ al mes\)/)).toBeInTheDocument();
    expect(screen.getByText('IVA incluido')).toBeInTheDocument();
    expect(screen.getByText(/Se renueva solo al cumplirse el plazo/)).toBeInTheDocument();
    expect(screen.getByText(/sigues con Plus hasta el final del periodo que has pagado/)).toBeInTheDocument();
    expect(screen.getByText(/Tienes 14 días desde que lo contratas para desistir/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'condiciones del servicio' })).toHaveAttribute('href', '/condiciones');
  });
});
