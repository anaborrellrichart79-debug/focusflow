import { configureStore } from '@reduxjs/toolkit';
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
    pomodoro: pomodoroReducer,
  },
});

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despachador = typeof store.dispatch;
