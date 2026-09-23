import { createSlice } from '@reduxjs/toolkit';
import * as api from '@/servicios/familia';
import type {
  EstadoFamilia,
  NuevaTareaAsignada,
  PersonaVinculada,
  TareaSupervisada,
} from '@/servicios/familia';
import { crearThunkApi } from './crearThunkApi';

interface EstadoFamiliaSlice {
  datos: EstadoFamilia | null;
  tareasPorSupervisado: Record<string, TareaSupervisada[]>;
  error: string | null;
}

const estadoInicial: EstadoFamiliaSlice = {
  datos: null,
  tareasPorSupervisado: {},
  error: null,
};

export const cargarFamilia = crearThunkApi<EstadoFamilia>(
  'familia/cargar',
  (token) => api.obtenerFamilia(token),
  'No se pudo cargar tu familia',
);

export const generarCodigoVinculo = crearThunkApi<{ codigo: string; expiraEn: string }>(
  'familia/generarCodigo',
  (token) => api.generarCodigoVinculo(token),
  'No se pudo generar el código',
);

export const vincularConCodigo = crearThunkApi<PersonaVinculada, string>(
  'familia/vincular',
  (token, codigo) => api.vincularConCodigo(token, codigo),
  'No se pudo completar el vínculo',
);

export const quitarVinculo = crearThunkApi<string, string>(
  'familia/quitarVinculo',
  async (token, vinculoId) => {
    await api.desvincular(token, vinculoId);
    return vinculoId;
  },
  'No se pudo deshacer el vínculo',
);

export const cargarTareasSupervisado = crearThunkApi<
  { supervisadoId: string; tareas: TareaSupervisada[] },
  string
>(
  'familia/cargarTareas',
  async (token, supervisadoId) => ({
    supervisadoId,
    tareas: await api.listarTareasSupervisado(token, supervisadoId),
  }),
  'No se pudieron cargar las tareas',
);

export const asignarTareaSupervisado = crearThunkApi<
  { supervisadoId: string; tarea: TareaSupervisada },
  { supervisadoId: string; datos: NuevaTareaAsignada }
>(
  'familia/asignarTarea',
  async (token, { supervisadoId, datos }) => ({
    supervisadoId,
    tarea: await api.asignarTarea(token, supervisadoId, datos),
  }),
  'No se pudo asignar la tarea',
);

export const revisarTareaSupervisado = crearThunkApi<
  { supervisadoId: string; tarea: TareaSupervisada },
  { supervisadoId: string; tareaId: string; decision: 'APROBADA' | 'DEVUELTA'; comentario?: string }
>(
  'familia/revisar',
  async (token, { supervisadoId, tareaId, decision, comentario }) => ({
    supervisadoId,
    tarea: await api.revisarTarea(token, tareaId, { decision, comentario }),
  }),
  'No se pudo guardar la revisión',
);

const familiaSlice = createSlice({
  name: 'familia',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarFamilia.fulfilled, (estado, accion) => {
        estado.datos = accion.payload;
      })
      .addCase(generarCodigoVinculo.fulfilled, (estado, accion) => {
        if (estado.datos) estado.datos.codigo = accion.payload;
      })
      .addCase(vincularConCodigo.fulfilled, (estado, accion) => {
        estado.datos?.supervisados.push(accion.payload);
      })
      .addCase(quitarVinculo.fulfilled, (estado, accion) => {
        if (!estado.datos) return;
        estado.datos.supervisados = estado.datos.supervisados.filter(
          (persona) => persona.vinculoId !== accion.payload,
        );
        estado.datos.responsables = estado.datos.responsables.filter(
          (persona) => persona.vinculoId !== accion.payload,
        );
      })
      .addCase(cargarTareasSupervisado.fulfilled, (estado, accion) => {
        estado.tareasPorSupervisado[accion.payload.supervisadoId] = accion.payload.tareas;
      })
      .addCase(asignarTareaSupervisado.fulfilled, (estado, accion) => {
        const { supervisadoId, tarea } = accion.payload;
        estado.tareasPorSupervisado[supervisadoId] = [
          tarea,
          ...(estado.tareasPorSupervisado[supervisadoId] ?? []),
        ];
      })
      .addCase(revisarTareaSupervisado.fulfilled, (estado, accion) => {
        const { supervisadoId, tarea } = accion.payload;
        estado.tareasPorSupervisado[supervisadoId] = (
          estado.tareasPorSupervisado[supervisadoId] ?? []
        ).map((actual) => (actual.id === tarea.id ? tarea : actual));
      })
      .addMatcher(
        (accion): accion is { type: string; payload: string } =>
          accion.type.startsWith('familia/') && accion.type.endsWith('/rejected'),
        (estado, accion) => {
          estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
        },
      )
      .addMatcher(
        (accion) => accion.type.startsWith('familia/') && accion.type.endsWith('/fulfilled'),
        (estado) => {
          estado.error = null;
        },
      );
  },
});

export default familiaSlice.reducer;
