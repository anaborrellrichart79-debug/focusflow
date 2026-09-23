import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import type { Etiqueta } from '@/servicios/etiquetas';
import { PaginaEtiquetas } from './PaginaEtiquetas';

function etiqueta(id: string, nombre: string, padreId: string | null = null): Etiqueta {
  return { id, nombre, padreId, usuarioId: 'usuario-1', creadoEn: '2026-09-01T00:00:00.000Z' };
}

const ETIQUETAS = [
  etiqueta('estudio', 'Estudio'),
  etiqueta('mates', 'Matemáticas', 'estudio'),
  etiqueta('calculo', 'Cálculo', 'mates'),
];

function simularApi() {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const cuerpo = opciones?.body ? JSON.parse(opciones.body as string) : null;
    const respuesta =
      opciones?.method === 'POST'
        ? etiqueta('nueva', cuerpo.nombre, cuerpo.padreId ?? null)
        : opciones?.method === 'PATCH'
          ? { ...ETIQUETAS.find((e) => url.endsWith(e.id)), ...cuerpo }
          : ETIQUETAS;
    return { ok: true, json: async () => respuesta } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('PaginaEtiquetas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enseña el árbol en orden y no deja crear una cuarta capa', async () => {
    simularApi();
    renderizarPagina(<PaginaEtiquetas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const lista = within(await screen.findByRole('list', { name: 'Tus etiquetas' }));
    expect(lista.getAllByRole('textbox').map((campo) => (campo as HTMLInputElement).value)).toEqual([
      'Estudio',
      'Matemáticas',
      'Cálculo',
    ]);

    const dentroDe = within(screen.getByRole('combobox', { name: 'Dentro de' }));
    expect(dentroDe.getAllByRole('option').map((opcion) => opcion.textContent)).toEqual([
      'Primer nivel',
      'Estudio',
      'Estudio › Matemáticas',
    ]);
  });

  it('crea una subetiqueta dentro de la elegida', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaEtiquetas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    const formulario = within(await screen.findByRole('form', { name: 'Nueva etiqueta' }));
    await usuario.type(formulario.getByRole('textbox', { name: 'Nombre' }), 'Álgebra');
    await usuario.selectOptions(formulario.getByRole('combobox', { name: 'Dentro de' }), 'mates');
    await usuario.click(formulario.getByRole('button', { name: 'Crear' }));

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/etiquetas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre: 'Álgebra', padreId: 'mates' }),
      }),
    );
    expect(await screen.findByDisplayValue('Álgebra')).toBeInTheDocument();
  });

  it('mover una etiqueta al primer nivel la envía con padreId null', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizarPagina(<PaginaEtiquetas />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

    await usuario.selectOptions(
      await screen.findByRole('combobox', { name: 'Mover Cálculo dentro de' }),
      '',
    );

    expect(fetchFalso).toHaveBeenCalledWith(
      'http://localhost:3000/etiquetas/calculo',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ padreId: null }) }),
    );
  });
});
