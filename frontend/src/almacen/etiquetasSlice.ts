import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  actualizarEtiqueta,
  crearEtiqueta,
  eliminarEtiqueta,
  listarEtiquetas as listarEtiquetasApi,
  type Etiqueta,
} from '@/servicios/etiquetas';
import { crearThunkApi } from './crearThunkApi';
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

export const anadirEtiqueta = crearThunkApi<Etiqueta, { nombre: string; padreId?: string }>(
  'etiquetas/anadir',
  (token, datos) => crearEtiqueta(token, datos),
  'No se pudo crear la etiqueta',
);

export const cambiarEtiqueta = crearThunkApi<
  Etiqueta,
  { id: string; nombre?: string; padreId?: string | null }
>(
  'etiquetas/cambiar',
  (token, { id, ...datos }) => actualizarEtiqueta(token, id, datos),
  'No se pudo guardar la etiqueta',
);

// Al borrar una etiqueta sus subetiquetas suben un nivel en el servidor: se
// recarga la lista entera para verlo.
export const quitarEtiqueta = crearThunkApi<Etiqueta[], string>(
  'etiquetas/quitar',
  async (token, id) => {
    await eliminarEtiqueta(token, id);
    return listarEtiquetasApi(token);
  },
  'No se pudo eliminar la etiqueta',
);

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
      })
      .addCase(anadirEtiqueta.fulfilled, (estado, accion) => {
        estado.lista.push(accion.payload);
        estado.lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        estado.error = null;
      })
      .addCase(cambiarEtiqueta.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.map((e) => (e.id === accion.payload.id ? accion.payload : e));
        estado.error = null;
      })
      .addCase(quitarEtiqueta.fulfilled, (estado, accion) => {
        estado.lista = accion.payload;
        estado.error = null;
      })
      .addMatcher(
        (accion): accion is { type: string; payload: string } =>
          [anadirEtiqueta.rejected.type, cambiarEtiqueta.rejected.type, quitarEtiqueta.rejected.type].includes(
            (accion as { type: string }).type,
          ),
        (estado, accion) => {
          estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
        },
      );
  },
});

export default etiquetasSlice.reducer;
