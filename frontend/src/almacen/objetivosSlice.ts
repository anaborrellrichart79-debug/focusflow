import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  crearObjetivo as crearObjetivoApi,
  eliminarObjetivo as eliminarObjetivoApi,
  listarObjetivos as listarObjetivosApi,
  type Objetivo,
} from '@/servicios/objetivos';
import type { EstadoRaiz } from './store';

interface EstadoObjetivos {
  lista: Objetivo[];
  cargando: boolean;
  error: string | null;
}

const estadoInicial: EstadoObjetivos = {
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

export const cargarObjetivos = createAsyncThunk<
  Objetivo[],
  void,
  { state: EstadoRaiz; rejectValue: string }
>('objetivos/cargar', async (_, { getState, rejectWithValue }) => {
  try {
    return await listarObjetivosApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudieron cargar los objetivos',
    );
  }
});

export const crearObjetivo = createAsyncThunk<
  Objetivo,
  { titulo: string; descripcion?: string },
  { state: EstadoRaiz; rejectValue: string }
>('objetivos/crear', async (datos, { getState, rejectWithValue }) => {
  try {
    return await crearObjetivoApi(tokenOError(getState()), datos);
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo crear el objetivo',
    );
  }
});

export const eliminarObjetivo = createAsyncThunk<
  string,
  string,
  { state: EstadoRaiz; rejectValue: string }
>('objetivos/eliminar', async (id, { getState, rejectWithValue }) => {
  try {
    await eliminarObjetivoApi(tokenOError(getState()), id);
    return id;
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo eliminar el objetivo',
    );
  }
});

const objetivosSlice = createSlice({
  name: 'objetivos',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarObjetivos.pending, (estado) => {
        estado.cargando = true;
        estado.error = null;
      })
      .addCase(cargarObjetivos.fulfilled, (estado, accion) => {
        estado.cargando = false;
        estado.lista = accion.payload;
      })
      .addCase(cargarObjetivos.rejected, (estado, accion) => {
        estado.cargando = false;
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      })
      .addCase(crearObjetivo.fulfilled, (estado, accion) => {
        estado.lista.unshift({
          ...accion.payload,
          totalTareas: 0,
          tareasCompletadas: 0,
        });
      })
      .addCase(eliminarObjetivo.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.filter((objetivo) => objetivo.id !== accion.payload);
      });
  },
});

export default objetivosSlice.reducer;
