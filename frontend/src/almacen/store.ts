import { configureStore } from '@reduxjs/toolkit';
import etiquetasReducer from './etiquetasSlice';
import familiaReducer from './familiaSlice';
import googleReducer from './googleSlice';
import notasReducer from './notasSlice';
import horarioReducer from './horarioSlice';
import interfazReducer from './interfazSlice';
import objetivosReducer from './objetivosSlice';
import pomodoroReducer from './pomodoroSlice';
import recordatoriosReducer from './recordatoriosSlice';
import sesionReducer from './sesionSlice';
import tareasReducer from './tareasSlice';

export const store = configureStore({
  reducer: {
    interfaz: interfazReducer,
    sesion: sesionReducer,
    objetivos: objetivosReducer,
    tareas: tareasReducer,
    etiquetas: etiquetasReducer,
    familia: familiaReducer,
    pomodoro: pomodoroReducer,
    google: googleReducer,
    notas: notasReducer,
    horario: horarioReducer,
    recordatorios: recordatoriosReducer,
  },
});

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despachador = typeof store.dispatch;
