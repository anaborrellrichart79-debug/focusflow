import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  actualizarSubtarea as actualizarSubtareaApi,
  crearSubtarea as crearSubtareaApi,
  eliminarSubtarea as eliminarSubtareaApi,
  type Subtarea,
} from '@/servicios/subtareas';
import {
  actualizarTarea as actualizarTareaApi,
  crearTarea as crearTareaApi,
  eliminarTarea as eliminarTareaApi,
  listarTareas as listarTareasApi,
  type Ambito,
  type EstadoTarea,
  type Recurrencia,
  type Tarea,
  type TipoEscolar,
} from '@/servicios/tareas';
import { ambitoParaNuevoElemento } from './selectores';
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
  {
    titulo: string;
    descripcion?: string;
    objetivoId?: string;
    fechaLimite?: string;
    etiquetas?: string[];
    recurrencia?: Recurrencia;
    ambito?: Ambito;
    tipoEscolar?: TipoEscolar;
    asignaturaHorarioId?: string;
  },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/crear', async (datos, { getState, rejectWithValue }) => {
  try {
    const estado = getState();
    return await crearTareaApi(tokenOError(estado), {
      ...datos,
      ambito: datos.ambito ?? ambitoParaNuevoElemento(estado),
    });
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
>('tareas/cambiarEstado', async ({ id, estado }, { getState, dispatch, rejectWithValue }) => {
  try {
    const tarea = await actualizarTareaApi(tokenOError(getState()), id, { estado });
    // Si la tarea era recurrente, el backend ya ha creado en silencio la
    // siguiente ocurrencia: se recarga la lista para que aparezca sin esperar
    // a la próxima navegación.
    if (estado === 'HECHA') {
      dispatch(cargarTareas());
    }
    return tarea;
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

export const cambiarFechaLimiteTarea = createAsyncThunk<
  Tarea,
  { id: string; fechaLimite: string; duracionMinutos?: number },
  { state: EstadoRaiz; rejectValue: string }
>(
  'tareas/cambiarFechaLimite',
  async ({ id, fechaLimite, duracionMinutos }, { getState, rejectWithValue }) => {
    try {
      return await actualizarTareaApi(tokenOError(getState()), id, {
        fechaLimite,
        duracionMinutos,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
      );
    }
  },
);

export const cambiarDescripcionTarea = createAsyncThunk<
  Tarea,
  { id: string; descripcion: string },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarDescripcion', async ({ id, descripcion }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { descripcion });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarEtiquetasTarea = createAsyncThunk<
  Tarea,
  { id: string; etiquetas: string[] },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarEtiquetas', async ({ id, etiquetas }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { etiquetas });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarRecurrenciaTarea = createAsyncThunk<
  Tarea,
  { id: string; recurrencia: Recurrencia },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarRecurrencia', async ({ id, recurrencia }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { recurrencia });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarAmbitoTarea = createAsyncThunk<
  Tarea,
  { id: string; ambito: Ambito },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarAmbito', async ({ id, ambito }, { getState, rejectWithValue }) => {
  try {
    // El tipo (examen, trabajo...) y la asignatura solo tienen sentido en una
    // tarea escolar: al pasarla a personal se quitan, para que no reaparezca
    // en el planificador si más adelante se vuelve a marcar como escolar.
    return await actualizarTareaApi(
      tokenOError(getState()),
      id,
      ambito === 'PERSONAL' ? { ambito, tipoEscolar: null, asignaturaHorarioId: null } : { ambito },
    );
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarTipoEscolarTarea = createAsyncThunk<
  Tarea,
  { id: string; tipoEscolar: TipoEscolar | null },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/cambiarTipoEscolar', async ({ id, tipoEscolar }, { getState, rejectWithValue }) => {
  try {
    return await actualizarTareaApi(tokenOError(getState()), id, { tipoEscolar });
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
    );
  }
});

export const cambiarAsignaturaTarea = createAsyncThunk<
  Tarea,
  { id: string; asignaturaHorarioId: string | null },
  { state: EstadoRaiz; rejectValue: string }
>(
  'tareas/cambiarAsignatura',
  async ({ id, asignaturaHorarioId }, { getState, rejectWithValue }) => {
    try {
      return await actualizarTareaApi(tokenOError(getState()), id, { asignaturaHorarioId });
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
      );
    }
  },
);

export const cambiarTiempoEstimadoTarea = createAsyncThunk<
  Tarea,
  { id: string; tiempoEstimadoMinutos: number },
  { state: EstadoRaiz; rejectValue: string }
>(
  'tareas/cambiarTiempoEstimado',
  async ({ id, tiempoEstimadoMinutos }, { getState, rejectWithValue }) => {
    try {
      return await actualizarTareaApi(tokenOError(getState()), id, { tiempoEstimadoMinutos });
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo actualizar la tarea',
      );
    }
  },
);

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

export const crearSubtareaTarea = createAsyncThunk<
  { tareaId: string; subtarea: Subtarea },
  { tareaId: string; titulo: string },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/crearSubtarea', async ({ tareaId, titulo }, { getState, rejectWithValue }) => {
  try {
    const subtarea = await crearSubtareaApi(tokenOError(getState()), tareaId, { titulo });
    return { tareaId, subtarea };
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo crear la subtarea',
    );
  }
});

export const cambiarSubtarea = createAsyncThunk<
  { tareaId: string; subtarea: Subtarea },
  { id: string; tareaId: string; completada?: boolean; titulo?: string },
  { state: EstadoRaiz; rejectValue: string }
>(
  'tareas/cambiarSubtarea',
  async ({ id, tareaId, ...cambios }, { getState, rejectWithValue }) => {
    try {
      const subtarea = await actualizarSubtareaApi(tokenOError(getState()), id, cambios);
      return { tareaId, subtarea };
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo actualizar la subtarea',
      );
    }
  },
);

export const eliminarSubtareaTarea = createAsyncThunk<
  { tareaId: string; id: string },
  { id: string; tareaId: string },
  { state: EstadoRaiz; rejectValue: string }
>('tareas/eliminarSubtarea', async ({ id, tareaId }, { getState, rejectWithValue }) => {
  try {
    await eliminarSubtareaApi(tokenOError(getState()), id);
    return { tareaId, id };
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo eliminar la subtarea',
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
      .addCase(crearSubtareaTarea.fulfilled, (estado, accion) => {
        const tarea = estado.lista.find((tarea) => tarea.id === accion.payload.tareaId);
        if (tarea) {
          tarea.subtareas.push(accion.payload.subtarea);
        }
      })
      .addCase(cambiarSubtarea.fulfilled, (estado, accion) => {
        const tarea = estado.lista.find((tarea) => tarea.id === accion.payload.tareaId);
        if (!tarea) return;
        const indice = tarea.subtareas.findIndex(
          (subtarea) => subtarea.id === accion.payload.subtarea.id,
        );
        if (indice !== -1) {
          tarea.subtareas[indice] = accion.payload.subtarea;
        }
      })
      .addCase(eliminarSubtareaTarea.fulfilled, (estado, accion) => {
        const tarea = estado.lista.find((tarea) => tarea.id === accion.payload.tareaId);
        if (tarea) {
          tarea.subtareas = tarea.subtareas.filter(
            (subtarea) => subtarea.id !== accion.payload.id,
          );
        }
      })
      .addMatcher(
        (accion): accion is { type: string; payload: Tarea } =>
          [
            cambiarEstadoTarea,
            cambiarPrioridadTarea,
            marcarAltoImpactoTarea,
            cambiarFechaLimiteTarea,
            cambiarDescripcionTarea,
            cambiarEtiquetasTarea,
            cambiarRecurrenciaTarea,
            cambiarAmbitoTarea,
            cambiarTipoEscolarTarea,
            cambiarAsignaturaTarea,
            cambiarTiempoEstimadoTarea,
          ].some((thunk) => thunk.fulfilled.match(accion)),
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
