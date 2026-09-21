import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  desconectarGoogle as desconectarGoogleApi,
  obtenerEstadoGoogle,
  obtenerUrlConexionGoogle,
  sincronizarGoogle as sincronizarGoogleApi,
  type EstadoGoogle,
  type ResumenSincronizacionGoogle,
} from '@/servicios/google';
import type { EstadoRaiz } from './store';

interface EstadoGoogleSlice {
  conectado: boolean;
  ultimaSincronizacion: string | null;
  sincronizando: boolean;
  cargandoEstado: boolean;
  ultimoResumen: ResumenSincronizacionGoogle | null;
  error: string | null;
}

const estadoInicial: EstadoGoogleSlice = {
  conectado: false,
  ultimaSincronizacion: null,
  sincronizando: false,
  cargandoEstado: false,
  ultimoResumen: null,
  error: null,
};

function tokenOError(estado: EstadoRaiz) {
  const token = estado.sesion.tokenAcceso;
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
}

export const cargarEstadoGoogle = createAsyncThunk<
  EstadoGoogle,
  void,
  { state: EstadoRaiz; rejectValue: string }
>('google/cargarEstado', async (_, { getState, rejectWithValue }) => {
  try {
    return await obtenerEstadoGoogle(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo comprobar la conexión con Google',
    );
  }
});

export const conectarConGoogle = createAsyncThunk<
  string,
  void,
  { state: EstadoRaiz; rejectValue: string }
>('google/conectar', async (_, { getState, rejectWithValue }) => {
  try {
    const { url } = await obtenerUrlConexionGoogle(tokenOError(getState()));
    return url;
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo iniciar la conexión con Google',
    );
  }
});

export const sincronizarGoogle = createAsyncThunk<
  ResumenSincronizacionGoogle,
  void,
  { state: EstadoRaiz; rejectValue: string }
>('google/sincronizar', async (_, { getState, rejectWithValue }) => {
  try {
    return await sincronizarGoogleApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo sincronizar con Google Calendar',
    );
  }
});

export const desconectarGoogle = createAsyncThunk<
  void,
  void,
  { state: EstadoRaiz; rejectValue: string }
>('google/desconectar', async (_, { getState, rejectWithValue }) => {
  try {
    await desconectarGoogleApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo desconectar Google Calendar',
    );
  }
});

const googleSlice = createSlice({
  name: 'google',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarEstadoGoogle.pending, (estado) => {
        estado.cargandoEstado = true;
      })
      .addCase(cargarEstadoGoogle.fulfilled, (estado, accion) => {
        estado.cargandoEstado = false;
        estado.conectado = accion.payload.conectado;
        estado.ultimaSincronizacion = accion.payload.ultimaSincronizacion;
      })
      .addCase(cargarEstadoGoogle.rejected, (estado) => {
        estado.cargandoEstado = false;
      })
      .addCase(conectarConGoogle.rejected, (estado, accion) => {
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      })
      .addCase(sincronizarGoogle.pending, (estado) => {
        estado.sincronizando = true;
        estado.error = null;
      })
      .addCase(sincronizarGoogle.fulfilled, (estado, accion) => {
        estado.sincronizando = false;
        estado.conectado = true;
        estado.ultimoResumen = accion.payload;
        estado.ultimaSincronizacion = new Date().toISOString();
      })
      .addCase(sincronizarGoogle.rejected, (estado, accion) => {
        estado.sincronizando = false;
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      })
      .addCase(desconectarGoogle.fulfilled, (estado) => {
        estado.conectado = false;
        estado.ultimaSincronizacion = null;
        estado.ultimoResumen = null;
      })
      .addCase(desconectarGoogle.rejected, (estado, accion) => {
        estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
      });
  },
});

export default googleSlice.reducer;
