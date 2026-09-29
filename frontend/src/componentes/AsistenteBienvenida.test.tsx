import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderizarPagina, SESION_AUTENTICADA } from '@/pruebas/render';
import { DisenoAplicacion } from './DisenoAplicacion';

const USUARIO_NUEVO = { ...SESION_AUTENTICADA.usuario!, nombre: 'Marta', bienvenidaCompletada: false };

// La API contesta a PATCH /preferencias con el usuario actualizado.
function simularApi() {
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    const cuerpo = opciones?.body ? JSON.parse(opciones.body as string) : {};
    const respuesta = url.endsWith('/autenticacion/preferencias') ? { ...USUARIO_NUEVO, ...cuerpo } : [];
    return { ok: true, status: 200, json: async () => respuesta } as Response;
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

function preferenciasEnviadas(fetchFalso: ReturnType<typeof simularApi>) {
  return fetchFalso.mock.calls
    .filter(([url]) => (url as string).endsWith('/autenticacion/preferencias'))
    .map(([, opciones]) => JSON.parse(opciones!.body as string));
}

function renderizar() {
  return renderizarPagina(
    <DisenoAplicacion>
      <p>Contenido de la página</p>
    </DisenoAplicacion>,
    { estadoPrecargado: { sesion: { ...SESION_AUTENTICADA, usuario: USUARIO_NUEVO } } },
  );
}

describe('AsistenteBienvenida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('una cuenta nueva ve el asistente en vez de la app', () => {
    simularApi();
    renderizar();

    expect(screen.getByText('¡Hola, Marta! ¿Para qué vas a usar FocusFlow?')).toBeInTheDocument();
    expect(screen.queryByText('Contenido de la página')).not.toBeInTheDocument();
  });

  it('sin ser estudiante son 2 pasos: guarda el perfil y, al empezar, no vuelve a salir', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    const { tienda } = renderizar();

    await usuario.click(screen.getByRole('checkbox', { name: /Padre o madre/ }));
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('¡Todo listo!')).toBeInTheDocument();
    // Consejo propio de padres.
    expect(screen.getByText(/genere un código en Familia/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Empezar' }));

    await waitFor(() => expect(tienda.getState().sesion.usuario?.bienvenidaCompletada).toBe(true));
    expect(preferenciasEnviadas(fetchFalso)).toEqual([{ perfiles: ['PADRE'] }, { bienvenidaCompletada: true }]);
    expect(await screen.findByText('Contenido de la página')).toBeInTheDocument();
  });

  it('estudiante: ofrece el modo escolar y después el horario', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizar();

    // Siendo estudiante hay dos pasos más: modo escolar y horario.
    await usuario.click(screen.getByRole('checkbox', { name: /Estudiante/ }));
    expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('¿Activamos el modo escolar?')).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 4')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Sí, activarlo' }));
    expect(await screen.findByText('Tu horario de clase')).toBeInTheDocument();
    expect(preferenciasEnviadas(fetchFalso)).toContainEqual({ modoEscolarActivo: true });

    await usuario.click(screen.getByRole('button', { name: 'Lo haré más tarde' }));
    expect(await screen.findByText('¡Todo listo!')).toBeInTheDocument();
  });

  it('se puede saltar desde el primer paso', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi();
    renderizar();

    await usuario.click(screen.getByRole('button', { name: 'Saltar' }));

    expect(await screen.findByText('Contenido de la página')).toBeInTheDocument();
    expect(preferenciasEnviadas(fetchFalso)).toEqual([{ bienvenidaCompletada: true }]);
  });
});
