import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Objetivo } from '@/servicios/objetivos';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PaginaObjetivos } from './PaginaObjetivos';

function crearObjetivoFalso(datos: Partial<Objetivo>): Objetivo {
  return {
    id: 'objetivo-1',
    titulo: 'Objetivo de prueba',
    descripcion: null,
    totalTareas: 0,
    tareasCompletadas: 0,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

describe('PaginaObjetivos', () => {
  it('sin objetivos, muestra el estado vacío', () => {
    renderizarPagina(<PaginaObjetivos />);

    expect(screen.getByText('Todavía no tienes objetivos. ¡Crea el primero!')).toBeInTheDocument();
  });

  it('muestra los objetivos precargados con su progreso', () => {
    const objetivos = [crearObjetivoFalso({ id: 'a', titulo: 'Aprender TypeScript' })];

    renderizarPagina(<PaginaObjetivos />, {
      estadoPrecargado: {
        objetivos: { lista: objetivos, cargando: false, error: null },
      },
    });

    expect(screen.getByText('Aprender TypeScript')).toBeInTheDocument();
  });

  describe('crear un objetivo nuevo', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, opciones?: RequestInit) => {
          if (url.endsWith('/tareas')) {
            return { ok: true, json: async () => [] } as Response;
          }
          if (url.endsWith('/objetivos') && opciones?.method === 'POST') {
            const datos = JSON.parse(opciones.body as string);
            return {
              ok: true,
              json: async () => crearObjetivoFalso({ id: 'nuevo', titulo: datos.titulo }),
            } as Response;
          }
          if (url.endsWith('/objetivos')) {
            return { ok: true, json: async () => [] } as Response;
          }
          throw new Error(`fetch inesperado: ${url}`);
        }),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('lo añade a la lista', async () => {
      const usuario = userEvent.setup();
      renderizarPagina(<PaginaObjetivos />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });

      await usuario.type(
        screen.getByPlaceholderText('Título del objetivo'),
        'Escribir el TFG',
      );
      await usuario.click(screen.getByRole('button', { name: 'Crear objetivo' }));

      expect(await screen.findByText('Escribir el TFG')).toBeInTheDocument();
      expect(
        screen.queryByText('Todavía no tienes objetivos. ¡Crea el primero!'),
      ).not.toBeInTheDocument();
    });
  });
});
