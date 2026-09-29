import { configureStore } from '@reduxjs/toolkit';
import { reductorRaiz } from './reductorRaiz';

export const store = configureStore({ reducer: reductorRaiz });

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despachador = typeof store.dispatch;
