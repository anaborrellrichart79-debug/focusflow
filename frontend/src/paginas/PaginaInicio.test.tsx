import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tarea } from '@/servicios/tareas';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { PaginaInicio } from './PaginaInicio';

function crearTareaFalsa(datos: Partial<Tarea>): Tarea {
  return {
    id: 'tarea-1',
    titulo: 'Tarea de prueba',
    descripcion: null,
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

describe('PaginaInicio', () => {
  it('sin sesión, muestra los enlaces de iniciar sesión y crear cuenta', () => {
    renderizarPagina(<PaginaInicio />);

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });

  it('con sesión, saluda al usuario (la navegación y el cierre de sesión viven en la barra lateral)', () => {
    renderizarPagina(<PaginaInicio />, {
      estadoPrecargado: { sesion: SESION_AUTENTICADA },
    });

    expect(screen.getByText('Hola, Ana')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
  });

  describe('widget "Próximos 7 días"', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('muestra solo las tareas pendientes con fecha límite en los próximos 7 días', () => {
      const tareas = [
        crearTareaFalsa({
          id: 'a',
          titulo: 'Dentro de rango',
          fechaLimite: '2026-06-18T12:00:00.000Z',
        }),
        crearTareaFalsa({
          id: 'b',
          titulo: 'Fuera de rango',
          fechaLimite: '2026-07-01T12:00:00.000Z',
        }),
        crearTareaFalsa({ id: 'c', titulo: 'Sin fecha', fechaLimite: null }),
        crearTareaFalsa({
          id: 'd',
          titulo: 'Ya completada',
          estado: 'HECHA',
          fechaLimite: '2026-06-16T12:00:00.000Z',
        }),
      ];

      renderizarPagina(<PaginaInicio />, {
        estadoPrecargado: {
          sesion: SESION_AUTENTICADA,
          tareas: { lista: tareas, cargando: false, error: null },
        },
      });

      expect(screen.getByText('Dentro de rango')).toBeInTheDocument();
      expect(screen.queryByText('Fuera de rango')).not.toBeInTheDocument();
      expect(screen.queryByText('Sin fecha')).not.toBeInTheDocument();
      expect(screen.queryByText('Ya completada')).not.toBeInTheDocument();
    });

    it('sin tareas próximas, muestra el mensaje vacío', () => {
      renderizarPagina(<PaginaInicio />, {
        estadoPrecargado: { sesion: SESION_AUTENTICADA },
      });

      expect(
        screen.getByText('No tienes tareas con fecha límite en los próximos 7 días.'),
      ).toBeInTheDocument();
    });
  });

  describe('Inicio según el perfil', () => {
    it('sin perfiles elegidos usa los sugeridos (Profesional sin modo escolar) y lo dice', () => {
      renderizarPagina(<PaginaInicio />, { estadoPrecargado: { sesion: SESION_AUTENTICADA } });

      expect(screen.getByText(/Inicio pensado para: Profesional \(sugerido;/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'cámbialo en Ajustes' })).toHaveAttribute('href', '/ajustes');
      expect(screen.getByText('Prioridades')).toBeInTheDocument();
      expect(screen.getByText('Pomodoros de hoy')).toBeInTheDocument();
      expect(screen.queryByText('Clases de hoy')).not.toBeInTheDocument();
      // Comunes a todos los perfiles.
      expect(screen.getByText('Próximos 7 días')).toBeInTheDocument();
      expect(screen.getByText('To-Do pendientes')).toBeInTheDocument();
    });

    it('con Estudiante y Padre elegidos, enseña sus tarjetas y no las de Profesional', () => {
      renderizarPagina(<PaginaInicio />, {
        estadoPrecargado: {
          sesion: {
            ...SESION_AUTENTICADA,
            usuario: { ...SESION_AUTENTICADA.usuario!, perfiles: ['ESTUDIANTE', 'PADRE'] },
          },
        },
      });

      expect(screen.getByText(/Inicio pensado para: Estudiante y Padre o madre/)).toBeInTheDocument();
      expect(screen.getByText('Clases de hoy')).toBeInTheDocument();
      expect(screen.getByText('Próximas entregas')).toBeInTheDocument();
      expect(screen.getByText('Revisiones pendientes')).toBeInTheDocument();
      expect(screen.queryByText('Prioridades')).not.toBeInTheDocument();
    });

    it('las prioridades son lo urgente e importante y lo de alto impacto sin terminar', () => {
      renderizarPagina(<PaginaInicio />, {
        estadoPrecargado: {
          sesion: SESION_AUTENTICADA,
          tareas: {
            lista: [
              crearTareaFalsa({ id: 'a', titulo: 'Informe urgente', urgente: true, importante: true }),
              crearTareaFalsa({ id: 'b', titulo: 'Propuesta clave', esAltoImpacto: true }),
              crearTareaFalsa({ id: 'c', titulo: 'Solo urgente', urgente: true }),
              crearTareaFalsa({ id: 'd', titulo: 'Ya hecha', esAltoImpacto: true, estado: 'HECHA' }),
            ],
            cargando: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('Informe urgente')).toBeInTheDocument();
      expect(screen.getByText('Propuesta clave')).toBeInTheDocument();
      expect(screen.queryByText('Solo urgente')).not.toBeInTheDocument();
      expect(screen.queryByText('Ya hecha')).not.toBeInTheDocument();
    });
  });
});
