import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { IDIOMA_POR_DEFECTO, type CodigoIdioma } from '@/idiomas';

interface EstadoInterfaz {
  idioma: CodigoIdioma;
}

const estadoInicial: EstadoInterfaz = {
  idioma: IDIOMA_POR_DEFECTO,
};

const interfazSlice = createSlice({
  name: 'interfaz',
  initialState: estadoInicial,
  reducers: {
    cambiarIdioma(estado, accion: PayloadAction<CodigoIdioma>) {
      estado.idioma = accion.payload;
    },
  },
});

export const { cambiarIdioma } = interfazSlice.actions;
export default interfazSlice.reducer;
