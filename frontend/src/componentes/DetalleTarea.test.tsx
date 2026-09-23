import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA, SESION_MODO_ESCOLAR } from '@/pruebas/render';
import { crearHorarioFalso } from '@/pruebas/horarioFalso';
import type { Tarea } from '@/servicios/tareas';
import { DetalleTarea } from './DetalleTarea';

function crearTareaFalsa(datos: Partial<Tarea>): Tarea {
  return {
    id: 'tarea-1',
    titulo: 'Preparar la presentación',
    descripcion: 'Incluir los datos del último trimestre',
    estado: 'POR_HACER',
    urgente: false,
    importante: false,
    esAltoImpacto: false,
    fechaLimite: null,
    duracionMinutos: null,
    ambito: 'PERSONAL',
    tipoEscolar: null,
    recurrencia: 'NINGUNA',
    tiempoEstimadoMinutos: null,
    subtareas: [],
    etiquetas: [],
    objetivoId: null,
    usuarioId: 'usuario-1',
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...datos,
  };
}

describe('DetalleTarea', () => {
  it('al pulsar el título se abre el diálogo con la descripción y la recurrencia actuales', async () => {
    const usuario = userEvent.setup();
    const tarea = crearTareaFalsa({ recurrencia: 'SEMANAL' });

    renderizarPagina(<DetalleTarea tarea={tarea} />);

    await usuario.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

    expect(await screen.findByText('Notas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Incluir los datos del último trimestre')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Repetir' })).toHaveValue('SEMANAL');
  });

  it('muestra las etiquetas y las subtareas existentes, con su progreso', async () => {
    const usuario = userEvent.setup();
    const tarea = crearTareaFalsa({
      etiquetas: [
        { id: 'e1', nombre: 'casa', usuarioId: 'usuario-1', creadoEn: '2026-01-01T00:00:00.000Z' },
      ],
      subtareas: [
        {
          id: 's1',
          titulo: 'Reunir cifras',
          completada: true,
          tareaId: 'tarea-1',
          creadoEn: '2026-01-01T00:00:00.000Z',
          actualizadoEn: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 's2',
          titulo: 'Diseñar diapositivas',
          completada: false,
          tareaId: 'tarea-1',
          creadoEn: '2026-01-01T00:00:00.000Z',
          actualizadoEn: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    renderizarPagina(<DetalleTarea tarea={tarea} />);
    await usuario.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

    expect(await screen.findByText('casa')).toBeInTheDocument();
    expect(screen.getByText('Subtareas (1 de 2)')).toBeInTheDocument();
    expect(screen.getByText('Reunir cifras')).toHaveClass('line-through');
    expect(screen.getByText('Diseñar diapositivas')).not.toHaveClass('line-through');
  });

  describe('acciones que escriben en el servidor', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('elegir quién la revisa lo guarda con un PATCH y muestra el estado de la revisión', async () => {
      const usuario = userEvent.setup();
      vi.mocked(fetch).mockImplementation(async (url) => {
        const tareaDevuelta = crearTareaFalsa({
          revisorId: 'mama',
          revisor: { id: 'mama', nombre: 'Mamá', correo: 'mama@example.com' },
        });
        return {
          ok: true,
          json: async () => (String(url).includes('/tareas/') ? tareaDevuelta : []),
        } as Response;
      });

      renderizarPagina(<DetalleTarea tarea={crearTareaFalsa({})} />, {
        estadoPrecargado: {
          sesion: SESION_AUTENTICADA,
          familia: {
            datos: {
              codigo: null,
              supervisados: [],
              responsables: [
                { vinculoId: 'v-1', id: 'mama', nombre: 'Mamá', correo: 'mama@example.com' },
              ],
            },
            tareasPorSupervisado: {},
            error: null,
          },
        },
      });
      await usuario.click(screen.getByRole('button', { name: 'Preparar la presentación' }));
      await usuario.selectOptions(screen.getByRole('combobox', { name: 'Revisión' }), 'mama');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ revisorId: 'mama' }) }),
      );
    });

    it('una tarea devuelta enseña el comentario de quien la revisó', async () => {
      const usuario = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

      renderizarPagina(
        <DetalleTarea
          tarea={crearTareaFalsa({
            revisorId: 'mama',
            revisor: { id: 'mama', nombre: 'Mamá', correo: 'mama@example.com' },
            estadoRevision: 'DEVUELTA',
            comentarioRevision: 'Falta la conclusión',
          })}
        />,
        { estadoPrecargado: { sesion: SESION_AUTENTICADA } },
      );
      await usuario.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      expect(screen.getByText(/Devuelta para corregir/)).toBeInTheDocument();
      expect(screen.getByText('«Falta la conclusión»')).toBeInTheDocument();
    });

    it('añadir un paso nuevo llama a la API de subtareas con el título escrito', async () => {
      // Al abrir el diálogo también se carga el historial de Pomodoro (para el
      // tiempo real): el mock debe distinguir esa petición de la de crear la
      // subtarea, o `historial` acaba con la forma equivocada en el estado.
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            id: 's-nueva',
            titulo: 'Ensayar la charla',
            completada: false,
            tareaId: 'tarea-1',
            creadoEn: '2026-01-01T00:00:00.000Z',
            actualizadoEn: '2026-01-01T00:00:00.000Z',
          }),
        } as Response;
      });

      const usuario = userEvent.setup();
      const tarea = crearTareaFalsa({});

      renderizarPagina(<DetalleTarea tarea={tarea} />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });
      await usuario.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      const dialogo = screen.getByRole('dialog');
      await usuario.type(
        within(dialogo).getByPlaceholderText('Nuevo paso'),
        'Ensayar la charla',
      );
      await usuario.click(within(dialogo).getAllByRole('button', { name: 'Añadir' })[1]);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1/subtareas',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ titulo: 'Ensayar la charla' }),
        }),
      );
    });

    it('poner una hora de inicio guarda la fecha límite con hora y la duración por defecto (30 min)', async () => {
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            ...crearTareaFalsa({ fechaLimite: '2026-06-20T09:00:00.000Z', duracionMinutos: 30 }),
          }),
        } as Response;
      });

      const tarea = crearTareaFalsa({ fechaLimite: '2026-06-20T00:00:00.000Z' });

      renderizarPagina(<DetalleTarea tarea={tarea} />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      const dialogo = screen.getByRole('dialog');
      const campoHora = within(dialogo).getByLabelText('Hora de inicio');
      fireEvent.change(campoHora, { target: { value: '09:00' } });
      fireEvent.blur(campoHora);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            fechaLimite: '2026-06-20T09:00:00.000Z',
            duracionMinutos: 30,
          }),
        }),
      );
    });

    it('cambiar el ámbito a "Escolar" lo guarda con un PATCH', async () => {
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: true, json: async () => crearTareaFalsa({ ambito: 'ESCOLAR' }) } as Response;
      });

      renderizarPagina(<DetalleTarea tarea={crearTareaFalsa({})} />, {
        estadoPrecargado: { sesion: SESION_MODO_ESCOLAR },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      const selectorAmbito = within(screen.getByRole('dialog')).getByRole('combobox', {
        name: 'Ámbito',
      });
      expect(selectorAmbito).toHaveValue('PERSONAL');
      fireEvent.change(selectorAmbito, { target: { value: 'ESCOLAR' } });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ ambito: 'ESCOLAR' }),
        }),
      );
    });

    it('el desplegable de tipo solo aparece en tareas escolares y guarda el tipo elegido', async () => {
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return {
          ok: true,
          json: async () => crearTareaFalsa({ ambito: 'ESCOLAR', tipoEscolar: 'EXAMEN' }),
        } as Response;
      });

      const { unmount } = renderizarPagina(<DetalleTarea tarea={crearTareaFalsa({})} />, {
        estadoPrecargado: { sesion: SESION_MODO_ESCOLAR },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));
      expect(within(screen.getByRole('dialog')).queryByRole('combobox', { name: 'Tipo' })).toBeNull();
      unmount();

      renderizarPagina(<DetalleTarea tarea={crearTareaFalsa({ ambito: 'ESCOLAR' })} />, {
        estadoPrecargado: { sesion: SESION_MODO_ESCOLAR },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));
      const selectorTipo = within(screen.getByRole('dialog')).getByRole('combobox', {
        name: 'Tipo',
      });
      expect(selectorTipo).toHaveValue('');
      fireEvent.change(selectorTipo, { target: { value: 'EXAMEN' } });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ tipoEscolar: 'EXAMEN' }),
        }),
      );
    });

    it('pasar una tarea escolar a personal le quita también el tipo', () => {
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: true, json: async () => crearTareaFalsa({}) } as Response;
      });

      renderizarPagina(
        <DetalleTarea tarea={crearTareaFalsa({ ambito: 'ESCOLAR', tipoEscolar: 'TRABAJO' })} />,
        { estadoPrecargado: { sesion: SESION_MODO_ESCOLAR } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));
      fireEvent.change(
        within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Ámbito' }),
        { target: { value: 'PERSONAL' } },
      );

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ ambito: 'PERSONAL', tipoEscolar: null, asignaturaHorarioId: null }),
        }),
      );
    });

    it('sin el modo escolar, el ámbito no ofrece "Escolar" (salvo si la tarea ya lo es) ni hay tipo', () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

      renderizarPagina(
        <DetalleTarea tarea={crearTareaFalsa({ ambito: 'ESCOLAR', tipoEscolar: 'EXAMEN' })} />,
        { estadoPrecargado: { sesion: SESION_AUTENTICADA } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      const dialogo = within(screen.getByRole('dialog'));
      const ambito = within(dialogo.getByRole('combobox', { name: 'Ámbito' }));
      expect(ambito.getAllByRole('option').map((opcion) => opcion.textContent)).toEqual([
        'Personal',
        'Escolar',
        'Eventual',
      ]);
      expect(dialogo.queryByRole('combobox', { name: 'Tipo' })).toBeNull();
    });

    it('en una tarea escolar, elegir la asignatura del horario la guarda con un PATCH', () => {
      vi.mocked(fetch).mockImplementation(async (entrada) => {
        const url = String(entrada);
        if (url.includes('/pomodoro/sesiones')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: true, json: async () => crearTareaFalsa({ ambito: 'ESCOLAR' }) } as Response;
      });

      renderizarPagina(<DetalleTarea tarea={crearTareaFalsa({ ambito: 'ESCOLAR' })} />, {
        estadoPrecargado: {
          sesion: SESION_MODO_ESCOLAR,
          horario: {
            cursos: [],
            lista: [],
            activo: crearHorarioFalso(),
            cargado: true,
            guardando: false,
            error: null,
          },
        },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Preparar la presentación' }));

      const selector = within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Asignatura' });
      expect(selector).toHaveValue('');
      fireEvent.change(selector, { target: { value: 'ah-lengua' } });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/tareas/tarea-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ asignaturaHorarioId: 'ah-lengua' }),
        }),
      );
    });
  });
});
