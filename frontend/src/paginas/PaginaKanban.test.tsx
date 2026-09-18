import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaKanban } from './PaginaKanban';

function crearTareaFalsa(datos: Partial<Tarea>): Tarea {
  return {
    id: 'tarea-1',
    titulo: 'Tarea de prueba',
    descripcion: null,
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    objetivoId: null,
    usuarioId: 'usuario-1',
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

function obtenerColumna(nombre: string) {
  const titulo = screen.getByText(nombre);
  const card = titulo.closest('[data-slot="card"]');
  if (!card) throw new Error(`No se encontró la columna "${nombre}"`);
  return within(card as HTMLElement);
}

describe('PaginaKanban', () => {
  it('reparte las tareas en su columna según el estado', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Por hacer 1', estado: 'POR_HACER' }),
      crearTareaFalsa({ id: 'b', titulo: 'En proceso 1', estado: 'EN_PROCESO' }),
      crearTareaFalsa({ id: 'c', titulo: 'Hecha 1', estado: 'HECHA' }),
    ];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(obtenerColumna('Por hacer').getByText('Por hacer 1')).toBeInTheDocument();
    expect(obtenerColumna('En proceso').getByText('En proceso 1')).toBeInTheDocument();
    expect(obtenerColumna('Hecha').getByText('Hecha 1')).toBeInTheDocument();

    expect(obtenerColumna('Por hacer').queryByText('En proceso 1')).not.toBeInTheDocument();
  });

  it('en la primera columna, el botón de mover a la anterior está deshabilitado', () => {
    const tareas = [crearTareaFalsa({ id: 'a', titulo: 'Sola', estado: 'POR_HACER' })];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(screen.getByRole('button', { name: 'Mover a la columna anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mover a la columna siguiente' })).toBeEnabled();
  });

  it('muestra la etiqueta del objetivo al que pertenece la tarea', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Con objetivo', objetivoId: 'objetivo-1' }),
    ];

    renderizarPagina(<PaginaKanban />, {
      estadoPrecargado: {
        tareas: { lista: tareas, cargando: false, error: null },
        objetivos: {
          lista: [
            {
              id: 'objetivo-1',
              titulo: 'Mi objetivo',
              descripcion: null,
              totalTareas: 1,
              tareasCompletadas: 0,
              creadoEn: '2026-01-01T00:00:00.000Z',
              actualizadoEn: '2026-01-01T00:00:00.000Z',
            },
          ],
          cargando: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('Mi objetivo')).toBeInTheDocument();
  });
});
