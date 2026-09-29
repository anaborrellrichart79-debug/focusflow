import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarPagina } from '@/pruebas/render';
import type { Etiqueta } from '@/servicios/etiquetas';
import type { Nota } from '@/servicios/notas';
import type { Objetivo } from '@/servicios/objetivos';
import type { Tarea } from '@/servicios/tareas';
import { BuscadorGlobal } from './BuscadorGlobal';

const TAREA = {
  id: 'tarea-1',
  titulo: 'Maqueta del volcán',
  descripcion: null,
  estado: 'EN_PROCESO',
  subtareas: [],
  etiquetas: [],
} as unknown as Tarea;

// Sin token de sesión los thunks de carga se rechazan al instante sin tocar la
// red, y la búsqueda trabaja sobre lo precargado.
function renderizar() {
  return renderizarPagina(<BuscadorGlobal abierto alCambiarAbierto={() => {}} />, {
    estadoPrecargado: {
      tareas: { lista: [TAREA], cargando: false, error: null },
      objetivos: {
        lista: [{ id: 'o-1', titulo: 'Aprobar Ciencias', descripcion: 'Estudiar volcanes' } as Objetivo],
        cargando: false,
        error: null,
      },
      notas: {
        lista: [{ id: 'n-1', tipo: 'TODO', contenido: 'Comprar arcilla para el volcán' } as Nota],
        cargando: false,
        error: null,
      } as never,
      etiquetas: {
        lista: [{ id: 'e-1', nombre: 'Ciencias', padreId: null } as Etiqueta],
        cargando: false,
        error: null,
      } as never,
    },
  });
}

describe('BuscadorGlobal', () => {
  it('pide al menos 2 letras antes de buscar', () => {
    renderizar();
    expect(screen.getByText(/Escribe al menos 2 letras/)).toBeInTheDocument();
  });

  it('encuentra tareas, objetivos y notas sin importar las tildes', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar en FocusFlow' }), 'volcan');

    const tareas = screen.getByRole('heading', { name: 'Tareas' }).closest('section')!;
    expect(within(tareas).getByRole('button', { name: 'Maqueta del volcán' })).toBeInTheDocument();
    expect(within(tareas).getByText('En progreso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aprobar Ciencias/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comprar arcilla para el volcán/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Etiquetas' })).not.toBeInTheDocument();
  });

  it('al elegir una etiqueta la aplica como filtro global', async () => {
    const usuario = userEvent.setup();
    const { tienda } = renderizar();

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar en FocusFlow' }), 'ciencias');
    const etiquetas = screen.getByRole('heading', { name: 'Etiquetas' }).closest('section')!;
    await usuario.click(within(etiquetas).getByRole('button', { name: /Ciencias/ }));

    expect(tienda.getState().interfaz.etiquetaFiltro).toBe('e-1');
  });

  it('avisa cuando no hay resultados', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar en FocusFlow' }), 'xyz');

    expect(screen.getByText('No hay nada que coincida con «xyz».')).toBeInTheDocument();
  });
});
