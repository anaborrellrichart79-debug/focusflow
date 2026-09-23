import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import * as api from '@/servicios/recordatorios';
import type {
  Aviso,
  CalendarioEscolar,
  CambiosRecordatorio,
  ConfiguracionEmergencia,
  ConfiguracionRecordatorios,
  DiaNoLectivoPropio,
  NuevoRecordatorio,
  Recordatorio,
} from '@/servicios/recordatorios';
import { crearThunkApi } from './crearThunkApi';
import type { EstadoRaiz } from './store';

interface EstadoRecordatorios {
  avisos: Aviso[];
  configuracion: ConfiguracionRecordatorios | null;
  calendario: CalendarioEscolar | null;
  comprobando: boolean;
  error: string | null;
}

const estadoInicial: EstadoRecordatorios = {
  avisos: [],
  configuracion: null,
  calendario: null,
  comprobando: false,
  error: null,
};

function crearThunk<Resultado, Argumento = void>(
  tipo: string,
  llamada: (token: string, argumento: Argumento) => Promise<Resultado>,
  mensajeError: string,
) {
  return crearThunkApi(`recordatorios/${tipo}`, llamada, mensajeError);
}

export const cargarAvisos = crearThunk<Aviso[]>(
  'cargarAvisos',
  (token) => api.obtenerAvisos(token),
  'No se pudieron cargar los avisos',
);

export const marcarAvisosMostrados = crearThunk<string[], string[]>(
  'marcarMostrados',
  async (token, ids) => {
    await api.marcarAvisosMostrados(token, ids);
    return ids;
  },
  'No se pudieron marcar los avisos',
);

export const leerAviso = crearThunk<string, string>(
  'leerAviso',
  async (token, id) => {
    await api.marcarAvisoLeido(token, id);
    return id;
  },
  'No se pudo marcar el aviso como leído',
);

export const leerTodosLosAvisos = crearThunk<void>(
  'leerTodos',
  (token) => api.marcarTodosLosAvisosLeidos(token),
  'No se pudieron marcar los avisos como leídos',
);

export const revisarTarea = crearThunk<string, string>(
  'revisarTarea',
  async (token, tareaId) => {
    await api.marcarTareaRevisada(token, tareaId);
    return tareaId;
  },
  'No se pudo marcar la tarea como revisada',
);

export const cargarConfiguracionRecordatorios = crearThunk<ConfiguracionRecordatorios>(
  'cargarConfiguracion',
  (token) => api.obtenerConfiguracionRecordatorios(token),
  'No se pudieron cargar los recordatorios',
);

export const anadirRecordatorio = crearThunk<Recordatorio, NuevoRecordatorio>(
  'anadir',
  (token, datos) => api.crearRecordatorio(token, datos),
  'No se pudo crear el recordatorio',
);

export const cambiarRecordatorio = crearThunk<
  Recordatorio,
  { id: string; cambios: CambiosRecordatorio }
>(
  'cambiar',
  (token, { id, cambios }) => api.actualizarRecordatorio(token, id, cambios),
  'No se pudo guardar el recordatorio',
);

export const quitarRecordatorio = crearThunk<string, string>(
  'quitar',
  async (token, id) => {
    await api.eliminarRecordatorio(token, id);
    return id;
  },
  'No se pudo eliminar el recordatorio',
);

export const cambiarEmergencia = crearThunk<ConfiguracionEmergencia, Partial<ConfiguracionEmergencia>>(
  'cambiarEmergencia',
  (token, cambios) => api.actualizarEmergencia(token, cambios),
  'No se pudo guardar el modo emergencia',
);

// Comprueba ya (sin esperar a los 5 minutos del proceso programado) y trae
// los avisos que hayan salido.
export const comprobarAhora = createAsyncThunk<
  number,
  void,
  { state: EstadoRaiz; rejectValue: string }
>('recordatorios/comprobar', async (_, { getState, dispatch, rejectWithValue }) => {
  const token = getState().sesion.tokenAcceso;
  if (!token) return rejectWithValue('No autenticado');
  try {
    const { creados } = await api.comprobarRecordatorios(token);
    await dispatch(cargarAvisos());
    return creados;
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudieron comprobar los recordatorios',
    );
  }
});

export const cargarCalendarioEscolar = crearThunk<CalendarioEscolar>(
  'cargarCalendario',
  (token) => api.obtenerCalendarioEscolar(token),
  'No se pudo cargar el calendario escolar',
);

export const anadirDiaNoLectivo = crearThunk<DiaNoLectivoPropio, Omit<DiaNoLectivoPropio, 'id'>>(
  'anadirDiaNoLectivo',
  (token, datos) => api.crearDiaNoLectivo(token, datos),
  'No se pudo añadir el día no lectivo',
);

export const quitarDiaNoLectivo = crearThunk<string, string>(
  'quitarDiaNoLectivo',
  async (token, id) => {
    await api.eliminarDiaNoLectivo(token, id);
    return id;
  },
  'No se pudo eliminar el día no lectivo',
);

const recordatoriosSlice = createSlice({
  name: 'recordatorios',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(cargarAvisos.fulfilled, (estado, accion) => {
        estado.avisos = accion.payload;
      })
      .addCase(marcarAvisosMostrados.pending, (estado, accion) => {
        // Se marca ya, sin esperar a la respuesta, para que la siguiente
        // consulta periódica no vuelva a sonar por los mismos avisos.
        const ahora = new Date().toISOString();
        const ids = new Set(accion.meta.arg);
        estado.avisos.forEach((aviso) => {
          if (ids.has(aviso.id)) aviso.mostradoEn ??= ahora;
        });
      })
      .addCase(leerAviso.fulfilled, (estado, accion) => {
        const aviso = estado.avisos.find((a) => a.id === accion.payload);
        if (aviso) aviso.leidoEn = new Date().toISOString();
      })
      .addCase(leerTodosLosAvisos.fulfilled, (estado) => {
        const ahora = new Date().toISOString();
        estado.avisos.forEach((aviso) => {
          aviso.leidoEn ??= ahora;
          aviso.mostradoEn ??= ahora;
        });
      })
      .addCase(revisarTarea.fulfilled, (estado, accion) => {
        const ahora = new Date().toISOString();
        estado.avisos.forEach((aviso) => {
          if (aviso.tipo === 'EMERGENCIA' && aviso.tareaId === accion.payload) aviso.leidoEn ??= ahora;
        });
      })
      .addCase(cargarConfiguracionRecordatorios.fulfilled, (estado, accion) => {
        estado.configuracion = accion.payload;
      })
      .addCase(anadirRecordatorio.fulfilled, (estado, accion) => {
        estado.configuracion?.recordatorios.push(accion.payload);
      })
      .addCase(cambiarRecordatorio.fulfilled, (estado, accion) => {
        if (!estado.configuracion) return;
        estado.configuracion.recordatorios = estado.configuracion.recordatorios.map((r) =>
          r.id === accion.payload.id ? accion.payload : r,
        );
      })
      .addCase(quitarRecordatorio.fulfilled, (estado, accion) => {
        if (!estado.configuracion) return;
        estado.configuracion.recordatorios = estado.configuracion.recordatorios.filter(
          (r) => r.id !== accion.payload,
        );
      })
      .addCase(cambiarEmergencia.fulfilled, (estado, accion) => {
        if (estado.configuracion) estado.configuracion.emergencia = accion.payload;
      })
      .addCase(comprobarAhora.pending, (estado) => {
        estado.comprobando = true;
      })
      .addCase(comprobarAhora.fulfilled, (estado) => {
        estado.comprobando = false;
      })
      .addCase(comprobarAhora.rejected, (estado) => {
        estado.comprobando = false;
      })
      .addCase(cargarCalendarioEscolar.fulfilled, (estado, accion) => {
        estado.calendario = accion.payload;
      })
      .addCase(anadirDiaNoLectivo.fulfilled, (estado, accion) => {
        estado.calendario?.propios.push(accion.payload);
        estado.calendario?.propios.sort((a, b) => a.inicio.localeCompare(b.inicio));
      })
      .addCase(quitarDiaNoLectivo.fulfilled, (estado, accion) => {
        if (!estado.calendario) return;
        estado.calendario.propios = estado.calendario.propios.filter((p) => p.id !== accion.payload);
      })
      // Un solo sitio para los errores de todas las acciones de este slice
      // que el usuario dispara a mano (la consulta periódica falla en silencio).
      .addMatcher(
        (accion): accion is { type: string; payload: string } =>
          accion.type.startsWith('recordatorios/') &&
          accion.type.endsWith('/rejected') &&
          !accion.type.startsWith('recordatorios/cargarAvisos') &&
          !accion.type.startsWith('recordatorios/marcarMostrados'),
        (estado, accion) => {
          estado.error = accion.payload ?? 'Ha ocurrido un error inesperado';
        },
      )
      .addMatcher(
        (accion) => accion.type.startsWith('recordatorios/') && accion.type.endsWith('/fulfilled'),
        (estado) => {
          estado.error = null;
        },
      );
  },
});

export default recordatoriosSlice.reducer;
