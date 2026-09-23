import { createSlice } from '@reduxjs/toolkit';
import * as api from '@/servicios/notas';
import type { CambiosNota, Nota, NuevaNota } from '@/servicios/notas';
import { crearThunkApi } from './crearThunkApi';

interface EstadoNotas {
  lista: Nota[];
  cargada: boolean;
  error: string | null;
}

const estadoInicial: EstadoNotas = { lista: [], cargada: false, error: null };

export const cargarNotas = crearThunkApi<Nota[]>(
  'notas/cargar',
  (token) => api.listarNotas(token),
  'No se pudieron cargar las notas',
);

export const anadirNota = crearThunkApi<Nota, NuevaNota>(
  'notas/anadir',
  (token, datos) => api.crearNota(token, datos),
  'No se pudo guardar la nota',
);

export const cambiarNota = crearThunkApi<Nota, { id: string; cambios: CambiosNota }>(
  'notas/cambiar',
  (token, { id, cambios }) => api.actualizarNota(token, id, cambios),
  'No se pudo guardar la nota',
);

export const quitarNota = crearThunkApi<string, string>(
  'notas/quitar',
  async (token, id) => {
    await api.eliminarNota(token, id);
    return id;
  },
  'No se pudo eliminar la nota',
);

const notasSlice = createSlice({
  name: 'notas',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarNotas.fulfilled, (estado, accion) => {
        estado.lista = accion.payload;
        estado.cargada = true;
      })
      .addCase(anadirNota.fulfilled, (estado, accion) => {
        estado.lista.unshift(accion.payload);
      })
      .addCase(cambiarNota.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.map((nota) =>
          nota.id === accion.payload.id ? accion.payload : nota,
        );
      })
      .addCase(quitarNota.fulfilled, (estado, accion) => {
        estado.lista = estado.lista.filter((nota) => nota.id !== accion.payload);
      })
      .addMatcher(
        (accion): accion is { type: string; payload: string } =>
          accion.type.startsWith('notas/') && accion.type.endsWith('/rejected'),
        (estado, accion) => {
          estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
        },
      )
      .addMatcher(
        (accion) => accion.type.startsWith('notas/') && accion.type.endsWith('/fulfilled'),
        (estado) => {
          estado.error = null;
        },
      );
  },
});

export default notasSlice.reducer;
