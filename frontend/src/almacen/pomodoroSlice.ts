import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import {
  listarSesionesPomodoro as listarSesionesPomodoroApi,
  registrarSesionPomodoro as registrarSesionPomodoroApi,
  type FasePomodoroApi,
  type SesionPomodoro,
} from '@/servicios/pomodoro';
import type { EstadoRaiz } from './store';

export type FasePomodoro = 'trabajo' | 'descansoCorto' | 'descansoLargo';

export const DURACION_TRABAJO_SEGUNDOS = 25 * 60;
export const DURACION_DESCANSO_CORTO_SEGUNDOS = 5 * 60;
export const DURACION_DESCANSO_LARGO_SEGUNDOS = 20 * 60;
export const CICLOS_PARA_DESCANSO_LARGO = 4;

const FASE_A_FASE_API: Record<FasePomodoro, FasePomodoroApi> = {
  trabajo: 'TRABAJO',
  descansoCorto: 'DESCANSO_CORTO',
  descansoLargo: 'DESCANSO_LARGO',
};

function duracionDeFase(fase: FasePomodoro): number {
  switch (fase) {
    case 'trabajo':
      return DURACION_TRABAJO_SEGUNDOS;
    case 'descansoCorto':
      return DURACION_DESCANSO_CORTO_SEGUNDOS;
    case 'descansoLargo':
      return DURACION_DESCANSO_LARGO_SEGUNDOS;
  }
}

function tokenOError(estado: EstadoRaiz) {
  const token = estado.sesion.tokenAcceso;
  if (!token) {
    throw new Error('No autenticado');
  }
  return token;
}

export const registrarSesionCompletada = createAsyncThunk<
  SesionPomodoro,
  { fase: FasePomodoro; duracionSegundos: number; tareaId?: string },
  { state: EstadoRaiz; rejectValue: string }
>(
  'pomodoro/registrarSesionCompletada',
  async ({ fase, duracionSegundos, tareaId }, { getState, rejectWithValue }) => {
    try {
      return await registrarSesionPomodoroApi(tokenOError(getState()), {
        fase: FASE_A_FASE_API[fase],
        duracionSegundos,
        tareaId,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo guardar la sesión de Pomodoro',
      );
    }
  },
);

export const cargarHistorialPomodoro = createAsyncThunk<
  SesionPomodoro[],
  void,
  { state: EstadoRaiz; rejectValue: string }
>('pomodoro/cargarHistorial', async (_, { getState, rejectWithValue }) => {
  try {
    return await listarSesionesPomodoroApi(tokenOError(getState()));
  } catch (error) {
    return rejectWithValue(
      error instanceof ErrorApi ? error.message : 'No se pudo cargar el historial de Pomodoro',
    );
  }
});

interface EstadoPomodoro {
  fase: FasePomodoro;
  segundosRestantes: number;
  activo: boolean;
  ciclosCompletados: number;
  notificacionPendiente: boolean;
  ultimaFaseCompletada: { fase: FasePomodoro; duracionSegundos: number } | null;
  historial: SesionPomodoro[];
}

const estadoInicial: EstadoPomodoro = {
  fase: 'trabajo',
  segundosRestantes: DURACION_TRABAJO_SEGUNDOS,
  activo: false,
  ciclosCompletados: 0,
  notificacionPendiente: false,
  ultimaFaseCompletada: null,
  historial: [],
};

const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState: estadoInicial,
  reducers: {
    iniciar(estado) {
      estado.activo = true;
    },
    pausar(estado) {
      estado.activo = false;
    },
    reiniciarFase(estado) {
      estado.activo = false;
      estado.segundosRestantes = duracionDeFase(estado.fase);
    },
    tick(estado) {
      if (!estado.activo) return;

      if (estado.segundosRestantes > 0) {
        estado.segundosRestantes -= 1;
        return;
      }

      const faseCompletada = estado.fase;

      if (estado.fase === 'trabajo') {
        estado.ciclosCompletados += 1;
        estado.fase =
          estado.ciclosCompletados % CICLOS_PARA_DESCANSO_LARGO === 0
            ? 'descansoLargo'
            : 'descansoCorto';
      } else {
        estado.fase = 'trabajo';
      }

      estado.segundosRestantes = duracionDeFase(estado.fase);
      estado.notificacionPendiente = true;
      estado.ultimaFaseCompletada = {
        fase: faseCompletada,
        duracionSegundos: duracionDeFase(faseCompletada),
      };
    },
    notificacionMostrada(estado) {
      estado.notificacionPendiente = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registrarSesionCompletada.fulfilled, (estado, accion) => {
        estado.historial.unshift(accion.payload);
      })
      .addCase(cargarHistorialPomodoro.fulfilled, (estado, accion) => {
        estado.historial = accion.payload;
      });
  },
});

export const { iniciar, pausar, reiniciarFase, tick, notificacionMostrada } =
  pomodoroSlice.actions;
export default pomodoroSlice.reducer;
