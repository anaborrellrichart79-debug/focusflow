import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { IDIOMA_POR_DEFECTO, type CodigoIdioma } from '@/idiomas';

export type Tema = 'claro' | 'oscuro';

const CLAVE_TEMA_LOCALSTORAGE = 'focusflow.tema';

function obtenerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_TEMA_LOCALSTORAGE);
  if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

interface EstadoInterfaz {
  idioma: CodigoIdioma;
  tema: Tema;
}

const estadoInicial: EstadoInterfaz = {
  idioma: IDIOMA_POR_DEFECTO,
  tema: obtenerTemaInicial(),
};

const interfazSlice = createSlice({
  name: 'interfaz',
  initialState: estadoInicial,
  reducers: {
    cambiarIdioma(estado, accion: PayloadAction<CodigoIdioma>) {
      estado.idioma = accion.payload;
    },
    alternarTema(estado) {
      estado.tema = estado.tema === 'claro' ? 'oscuro' : 'claro';
      localStorage.setItem(CLAVE_TEMA_LOCALSTORAGE, estado.tema);
    },
  },
});

export const { cambiarIdioma, alternarTema } = interfazSlice.actions;
export default interfazSlice.reducer;
