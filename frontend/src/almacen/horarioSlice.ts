import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  actualizarHorario as actualizarHorarioApi,
  anadirAsignaturaHorario as anadirAsignaturaHorarioApi,
  asignarSesion as asignarSesionApi,
  cambiarColorAsignaturaHorario as cambiarColorAsignaturaHorarioApi,
  crearHorario as crearHorarioApi,
  eliminarHorario as eliminarHorarioApi,
  listarCursos,
  listarHorarios,
  obtenerHorarioActivo,
  quitarAsignaturaHorario as quitarAsignaturaHorarioApi,
  reemplazarFranjas as reemplazarFranjasApi,
  type ComunidadAutonoma,
  type Curso,
  type DatosFranja,
  type Horario,
  type HorarioResumen,
} from '@/servicios/horarios';
import type { EstadoRaiz } from './store';

interface EstadoHorario {
  cursos: Curso[];
  lista: HorarioResumen[];
  activo: Horario | null;
  // false hasta la primera respuesta de /horarios/activo: distingue "todavía
  // no sé si hay horario" de "no hay horario" (null en ambos casos).
  cargado: boolean;
  guardando: boolean;
  error: string | null;
}

const estadoInicial: EstadoHorario = {
  cursos: [],
  lista: [],
  activo: null,
  cargado: false,
  guardando: false,
  error: null,
};

function tokenOError(estado: EstadoRaiz) {
  const token = estado.sesion.tokenAcceso;
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
}

function mensajeDeError(error: unknown, porDefecto: string) {
  return error instanceof ErrorApi ? error.message : porDefecto;
}

export const cargarCursos = createAsyncThunk<Curso[], void, { state: EstadoRaiz; rejectValue: string }>(
  'horario/cargarCursos',
  async (_, { getState, rejectWithValue }) => {
    try {
      return await listarCursos(tokenOError(getState()));
    } catch (error) {
      return rejectWithValue(mensajeDeError(error, 'No se pudieron cargar los cursos'));
    }
  },
);

export const cargarHorarios = createAsyncThunk<
  { lista: HorarioResumen[]; activo: Horario | null },
  void,
  { state: EstadoRaiz; rejectValue: string }
>('horario/cargar', async (_, { getState, rejectWithValue }) => {
  try {
    const token = tokenOError(getState());
    const [lista, activo] = await Promise.all([listarHorarios(token), obtenerHorarioActivo(token)]);
    return { lista, activo };
  } catch (error) {
    return rejectWithValue(mensajeDeError(error, 'No se pudo cargar el horario'));
  }
});

// Todas las operaciones de edición devuelven el horario completo ya
// actualizado, así que comparten un mismo creador y un mismo reducer.
function crearThunkDeEdicion<Argumento>(
  tipo: string,
  llamada: (token: string, argumento: Argumento) => Promise<Horario>,
) {
  return createAsyncThunk<Horario, Argumento, { state: EstadoRaiz; rejectValue: string }>(
    `horario/${tipo}`,
    async (argumento, { getState, rejectWithValue }) => {
      try {
        return await llamada(tokenOError(getState()), argumento);
      } catch (error) {
        return rejectWithValue(mensajeDeError(error, 'No se pudo guardar el horario'));
      }
    },
  );
}

export const crearHorario = crearThunkDeEdicion(
  'crear',
  (token, datos: { titulo: string; periodo: string; cursoId: string; comunidad: ComunidadAutonoma }) =>
    crearHorarioApi(token, datos),
);

export const actualizarHorario = crearThunkDeEdicion(
  'actualizar',
  (
    token,
    { id, ...datos }: { id: string } & Partial<{ titulo: string; periodo: string; comunidad: ComunidadAutonoma; activo: boolean }>,
  ) => actualizarHorarioApi(token, id, datos),
);

export const reemplazarFranjas = crearThunkDeEdicion(
  'reemplazarFranjas',
  (token, { id, franjas }: { id: string; franjas: DatosFranja[] }) =>
    reemplazarFranjasApi(token, id, franjas),
);

export const anadirAsignaturaHorario = crearThunkDeEdicion(
  'anadirAsignatura',
  (token, { id, asignaturaId }: { id: string; asignaturaId: string }) =>
    anadirAsignaturaHorarioApi(token, id, asignaturaId),
);

export const cambiarColorAsignaturaHorario = crearThunkDeEdicion(
  'cambiarColorAsignatura',
  (token, { id, asignaturaHorarioId, color }: { id: string; asignaturaHorarioId: string; color: string }) =>
    cambiarColorAsignaturaHorarioApi(token, id, asignaturaHorarioId, color),
);

export const quitarAsignaturaHorario = crearThunkDeEdicion(
  'quitarAsignatura',
  (token, { id, asignaturaHorarioId }: { id: string; asignaturaHorarioId: string }) =>
    quitarAsignaturaHorarioApi(token, id, asignaturaHorarioId),
);

export const asignarSesion = crearThunkDeEdicion(
  'asignarSesion',
  (
    token,
    {
      id,
      ...datos
    }: { id: string; franjaId: string; diaSemana: number; asignaturaHorarioId: string | null; aula?: string },
  ) => asignarSesionApi(token, id, datos),
);

export const eliminarHorario = createAsyncThunk<string, string, { state: EstadoRaiz; rejectValue: string }>(
  'horario/eliminar',
  async (id, { getState, rejectWithValue }) => {
    try {
      await eliminarHorarioApi(tokenOError(getState()), id);
      return id;
    } catch (error) {
      return rejectWithValue(mensajeDeError(error, 'No se pudo borrar el horario'));
    }
  },
);

const THUNKS_DE_EDICION = [
  crearHorario,
  actualizarHorario,
  reemplazarFranjas,
  anadirAsignaturaHorario,
  cambiarColorAsignaturaHorario,
  quitarAsignaturaHorario,
  asignarSesion,
];

const horarioSlice = createSlice({
  name: 'horario',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarCursos.fulfilled, (estado, accion) => {
        estado.cursos = accion.payload;
      })
      .addCase(cargarHorarios.fulfilled, (estado, accion) => {
        estado.lista = accion.payload.lista;
        estado.activo = accion.payload.activo;
        estado.cargado = true;
      })
      .addCase(cargarHorarios.rejected, (estado, accion) => {
        estado.cargado = true;
        estado.error = accion.payload ?? null;
      })
      .addCase(eliminarHorario.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.filter((horario) => horario.id !== accion.payload);
        if (estado.activo?.id === accion.payload) {
          estado.activo = null;
        }
      })
      .addMatcher(
        (accion) => THUNKS_DE_EDICION.some((thunk) => thunk.pending.match(accion)),
        (estado) => {
          estado.guardando = true;
          estado.error = null;
        },
      )
      .addMatcher(
        (accion) => THUNKS_DE_EDICION.some((thunk) => thunk.rejected.match(accion)),
        (estado, accion: { payload?: string }) => {
          estado.guardando = false;
          estado.error = accion.payload ?? 'No se pudo guardar el horario';
        },
      )
      .addMatcher(
        (accion): accion is { type: string; payload: Horario } =>
          THUNKS_DE_EDICION.some((thunk) => thunk.fulfilled.match(accion)),
        (estado, accion) => {
          const horario = accion.payload;
          estado.guardando = false;
          const { franjas: _franjas, asignaturas: _asignaturas, sesiones: _sesiones, ...resumen } =
            horario;
          const indice = estado.lista.findIndex((existente) => existente.id === horario.id);
          if (indice === -1) estado.lista.unshift(resumen);
          else estado.lista[indice] = resumen;

          if (horario.activo) {
            // Al activar uno, el backend ha desactivado los demás.
            estado.lista = estado.lista.map((existente) =>
              existente.id === horario.id ? existente : { ...existente, activo: false },
            );
            estado.activo = horario;
          } else if (estado.activo?.id === horario.id) {
            estado.activo = null;
          }
        },
      );
  },
});

export default horarioSlice.reducer;
