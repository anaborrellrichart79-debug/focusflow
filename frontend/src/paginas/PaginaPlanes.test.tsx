import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
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

  it('sin sesión, invita a crear la cuenta o iniciar sesión para contratar', () => {
    renderizarPagina(<PaginaPlanes />, { ruta: '/planes' });
    expect(screen.getByRole('link', { name: 'Crea tu cuenta gratis' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'inicia sesión' })).toHaveAttribute('href', '/login');
  });

  describe('con sesión', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('una adulta sin Plus puede contratarlo desde aquí', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ incluida: false, origen: null, usados: 0, limite: 100, puedeContratar: true }),
        } as Response),
      );
      renderizarPagina(<PaginaPlanes />, { ruta: '/planes', estadoPrecargado: { sesion: SESION_AUTENTICADA } });
      expect(await screen.findByRole('button', { name: 'Pasar a Plus' })).toBeInTheDocument();
    });
  });
});
