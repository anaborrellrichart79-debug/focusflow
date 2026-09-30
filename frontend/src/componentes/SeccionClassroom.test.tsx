import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { SeccionClassroom } from './SeccionClassroom';

function renderizar(classroom: boolean, conectado = true) {
  return renderizarPagina(<SeccionClassroom />, {
    estadoPrecargado: {
      sesion: SESION_AUTENTICADA,
      google: {
        conectado,
        classroom,
        ultimaSincronizacion: null,
        sincronizando: false,
        cargandoEstado: false,
        ultimoResumen: null,
        error: null,
      },
    },
  });
}

describe('SeccionClassroom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sin Google conectado se ve igual y ofrece conectar Google y Classroom de una vez', () => {
    renderizar(false, false);

    expect(screen.getByText('Google Classroom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conectar Google y Classroom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Importar deberes ahora' })).not.toBeInTheDocument();
  });

  it('sin Classroom conectado ofrece conectarlo y avisa de que es solo lectura', () => {
    renderizar(false);

    expect(screen.getByRole('button', { name: 'Conectar Google Classroom' })).toBeInTheDocument();
    expect(screen.getByText(/nunca escribe en Classroom/)).toBeInTheDocument();
  });

  it('con Classroom conectado importa y resume lo importado', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi.fn(async (url: string) => {
      const cuerpo = url.endsWith('/google/classroom/importar') ? { cursos: 2, nuevas: 3, actualizadas: 1 } : [];
      return { ok: true, status: 200, json: async () => cuerpo } as Response;
    });
    vi.stubGlobal('fetch', fetchFalso);
    renderizar(true);

    await usuario.click(screen.getByRole('button', { name: 'Importar deberes ahora' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '2 clases revisadas: 3 trabajos nuevos y 1 actualizado.',
    );
  });

  it('si Google no deja leer Classroom, lo explica', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: 'x', codigo: 'CLASSROOM_API_DESACTIVADA' }),
      }),
    );
    renderizar(true);

    await usuario.click(screen.getByRole('button', { name: 'Importar deberes ahora' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La API de Google Classroom no está activada en el proyecto de Google Cloud',
    );
  });
});
