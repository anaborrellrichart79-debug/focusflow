import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import { listarEtiquetas as listarEtiquetasApi, type Etiqueta } from '@/servicios/etiquetas';
import type { EstadoRaiz } from './store';

interface EstadoEtiquetas {
  lista: Etiqueta[];
  cargando: boolean;
  error: string | null;
}

const estadoInicial: EstadoEtiquetas = {
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

export const cargarEtiquetas = createAsyncThunk<
  Etiqueta[],
  void,
  { state: EstadoRaiz; rejectValue: string }
>('etiquetas/cargar', async (_, { getState, rejectWithValue }) => {
  try {
    return await listarEtiquetasApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudieron cargar las etiquetas',
    );
  }
});

const etiquetasSlice = createSlice({
  name: 'etiquetas',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarEtiquetas.pending, (estado) => {
        estado.cargando = true;
        estado.error = null;
      })
      .addCase(cargarEtiquetas.fulfilled, (estado, accion) => {
        estado.cargando = false;
        estado.lista = accion.payload;
      })
      .addCase(cargarEtiquetas.rejected, (estado, accion) => {
        estado.cargando = false;
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      });
  },
});

export default etiquetasSlice.reducer;
