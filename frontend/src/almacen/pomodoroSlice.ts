import { createSlice } from '@reduxjs/toolkit';

export type FasePomodoro = 'trabajo' | 'descansoCorto' | 'descansoLargo';

export const DURACION_TRABAJO_SEGUNDOS = 25 * 60;
export const DURACION_DESCANSO_CORTO_SEGUNDOS = 5 * 60;
export const DURACION_DESCANSO_LARGO_SEGUNDOS = 20 * 60;
export const CICLOS_PARA_DESCANSO_LARGO = 4;

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

interface EstadoPomodoro {
  fase: FasePomodoro;
  segundosRestantes: number;
  activo: boolean;
  ciclosCompletados: number;
  notificacionPendiente: boolean;
}

const estadoInicial: EstadoPomodoro = {
  fase: 'trabajo',
  segundosRestantes: DURACION_TRABAJO_SEGUNDOS,
  activo: false,
  ciclosCompletados: 0,
  notificacionPendiente: false,
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
    },
    notificacionMostrada(estado) {
      estado.notificacionPendiente = false;
    },
  },
});

export const { iniciar, pausar, reiniciarFase, tick, notificacionMostrada } =
  pomodoroSlice.actions;
export default pomodoroSlice.reducer;
