import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  actualizarTarea as actualizarTareaApi,
  crearTarea as crearTareaApi,
  eliminarTarea as eliminarTareaApi,
  listarTareas as listarTareasApi,
  type EstadoTarea,
  type Tarea,
} from '@/servicios/tareas';
import type { EstadoRaiz } from './store';

interface EstadoTareas {
  lista: Tarea[];
  cargando: boolean;
  error: string | null;
}

const estadoInicial: EstadoTareas = {
  lista: [],
  cargando: false,
  error: null,
};

function tokenOError(estado: EstadoRaiz) {
  const token = estado.sesion.tokenAcceso;
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
}

export const cargarTareas = createAsyncThunk<
  Tarea[],
  void,
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cargar', async (_, { getState, rejectWithValue }) => {
  try {
    return await listarTareasApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudieron cargar las tareas',
    );
  }
});

export const crearTarea = createAsyncThunk<
  Tarea,
  { titulo: string; descripcion?: string; objetivoId?: string },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/crear', async (datos, { getState, rejectWithValue }) => {
  try {
    return await crearTareaApi(tokenOError(getState()), datos);
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo crear la tarea',
    );
  }
});

export const cambiarEstadoTarea = createAsyncThunk<
  Tarea,
  { id: string; estado: EstadoTarea },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarEstado', async ({ id, estado }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { estado });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarPrioridadTarea = createAsyncThunk<
  Tarea,
  { id: string; urgente: boolean; importante: boolean },
  { state: EstadoRaiz; rejectValue: string }
>(
  'tareas/cambiarPrioridad',
  async ({ id, urgente, importante }, { getState, rejectWithValue }) => {
    try {
      return await actualizarTareaApi(tokenOError(getState()), id, { urgente, importante });
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
      );
    }
  },
);

export const marcarAltoImpactoTarea = createAsyncThunk<
  Tarea,
  { id: string; esAltoImpacto: boolean },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/marcarAltoImpacto', async ({ id, esAltoImpacto }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { esAltoImpacto });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const eliminarTarea = createAsyncThunk<
  string,
  string,
  { state: EstadoRaiz; rejectValue: string }
>('tareas/eliminar', async (id, { getState, rejectWithValue }) => {
  try {
    await eliminarTareaApi(tokenOError(getState()), id);
    return id;
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo eliminar la tarea',
    );
  }
});

const tareasSlice = createSlice({
  name: 'tareas',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarTareas.pending, (estado) => {
        estado.cargando = true;
        estado.error = null;
      })
      .addCase(cargarTareas.fulfilled, (estado, accion) => {
        estado.cargando = false;
        estado.lista = accion.payload;
      })
      .addCase(cargarTareas.rejected, (estado, accion) => {
        estado.cargando = false;
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      })
      .addCase(crearTarea.fulfilled, (estado, accion) => {
        estado.lista.unshift(accion.payload);
      })
      .addCase(eliminarTarea.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.filter((tarea) => tarea.id !== accion.payload);
      })
      .addMatcher(
        (accion): accion is { type: string; payload: Tarea } =>
          [cambiarEstadoTarea, cambiarPrioridadTarea, marcarAltoImpactoTarea].some(
            (thunk) => thunk.fulfilled.match(accion),
          ),
        (estado, accion) => {
          const indice = estado.lista.findIndex((tarea) => tarea.id === accion.payload.id);
          if (indice !== -1) {
            estado.lista[indice] = accion.payload;
          }
        },
      );
  },
});

export default tareasSlice.reducer;
