import { createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorApi } from '@/servicios/api';
import type { EstadoRaiz } from './store';

// Thunk con el patrón de siempre: sacar el token de la sesión, llamar a la API
// y convertir cualquier error en un mensaje para la interfaz.
export function crearThunkApi<Resultado, Argumento = void>(
  tipo: string,
  llamada: (token: string, argumento: Argumento) => Promise<Resultado>,
  mensajeError: string,
) {
  return createAsyncThunk<Resultado, Argumento, { state: EstadoRaiz; rejectValue: string }>(
    tipo,
    async (argumento, { getState, rejectWithValue }) => {
      const token = getState().sesion.tokenAcceso;
      if (!token) return rejectWithValue('No autenticado');
      try {
        return await llamada(token, argumento);
      } catch (error) {
        return rejectWithValue(error instanceof ErrorApi ? error.message : mensajeError);
      }
    },
  );
}
