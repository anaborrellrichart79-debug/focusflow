import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina } from '@/pruebas/render';
import { PaginaEisenhower } from './PaginaEisenhower';

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

function obtenerCuadrante(nombre: string) {
  const titulo = screen.getByText(nombre);
  const card = titulo.closest('[data-slot="card"]');
  if (!card) throw new Error(`No se encontró el cuadrante "${nombre}"`);
  return within(card as HTMLElement);
}

describe('PaginaEisenhower', () => {
  it('reparte las tareas en su cuadrante según urgente/importante', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Tarea urgente e importante', urgente: true, importante: true }),
      crearTareaFalsa({ id: 'b', titulo: 'Tarea a planificar', urgente: false, importante: true }),
      crearTareaFalsa({ id: 'c', titulo: 'Tarea a delegar', urgente: true, importante: false }),
      crearTareaFalsa({ id: 'd', titulo: 'Tarea a eliminar', urgente: false, importante: false }),
    ];

    renderizarPagina(<PaginaEisenhower />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(obtenerCuadrante('Hacer ya').getByText('Tarea urgente e importante')).toBeInTheDocument();
    expect(obtenerCuadrante('Planificar').getByText('Tarea a planificar')).toBeInTheDocument();
    expect(obtenerCuadrante('Delegar').getByText('Tarea a delegar')).toBeInTheDocument();
    expect(obtenerCuadrante('Eliminar').getByText('Tarea a eliminar')).toBeInTheDocument();

    expect(obtenerCuadrante('Hacer ya').queryByText('Tarea a planificar')).not.toBeInTheDocument();
  });

  it('los botones de urgente/importante anuncian su estado con aria-pressed', () => {
    const tareas = [
      crearTareaFalsa({ id: 'a', titulo: 'Mixta', urgente: true, importante: false }),
    ];

    renderizarPagina(<PaginaEisenhower />, {
      estadoPrecargado: { tareas: { lista: tareas, cargando: false, error: null } },
    });

    expect(screen.getByRole('button', { name: 'Urgente' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Importante' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
