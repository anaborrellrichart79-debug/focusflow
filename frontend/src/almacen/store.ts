import { configureStore } from '@reduxjs/toolkit';
import etiquetasReducer from './etiquetasSlice';
import googleReducer from './googleSlice';
import interfazReducer from './interfazSlice';
import objetivosReducer from './objetivosSlice';
import pomodoroReducer from './pomodoroSlice';
import sesionReducer from './sesionSlice';
import tareasReducer from './tareasSlice';

export const store = configureStore({
  reducer: {
    interfaz: interfazReducer,
    sesion: sesionReducer,
    objetivos: objetivosReducer,
    tareas: tareasReducer,
    etiquetas: etiquetasReducer,
    pomodoro: pomodoroReducer,
    google: googleReducer,
  },
});

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despachador = typeof store.dispatch;
