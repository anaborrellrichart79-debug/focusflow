import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { IDIOMA_POR_DEFECTO, type CodigoIdioma } from '@/idiomas';
import type { Ambito } from '@/servicios/tareas';

export type Tema = 'claro' | 'oscuro';
export type AmbitoActivo = Ambito | 'TODOS';

const CLAVE_TEMA_LOCALSTORAGE = 'focusflow.tema';
const CLAVE_AMBITO_LOCALSTORAGE = 'focusflow.ambito';

function obtenerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_TEMA_LOCALSTORAGE);
  if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'oscuro' : 'claro';
}

function obtenerAmbitoInicial(): AmbitoActivo {
  const guardado = localStorage.getItem(CLAVE_AMBITO_LOCALSTORAGE);
  if (guardado === 'PERSONAL' || guardado === 'ESCOLAR' || guardado === 'EVENTUAL') return guardado;
  return 'TODOS';
}

interface EstadoInterfaz {
  idioma: CodigoIdioma;
  tema: Tema;
  ambitoActivo: AmbitoActivo;
  // Etiqueta por la que se filtran todas las vistas (incluye sus
  // subetiquetas); null = sin filtro. No se guarda entre sesiones.
  etiquetaFiltro?: string | null;
}

const estadoInicial: EstadoInterfaz = {
  idioma: IDIOMA_POR_DEFECTO,
  tema: obtenerTemaInicial(),
  ambitoActivo: obtenerAmbitoInicial(),
  etiquetaFiltro: null,
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
    cambiarAmbitoActivo(estado, accion: PayloadAction<AmbitoActivo>) {
      estado.ambitoActivo = accion.payload;
      localStorage.setItem(CLAVE_AMBITO_LOCALSTORAGE, accion.payload);
    },
    cambiarEtiquetaFiltro(estado, accion: PayloadAction<string | null>) {
      estado.etiquetaFiltro = accion.payload;
    },
  },
});

export const { cambiarIdioma, alternarTema, cambiarAmbitoActivo, cambiarEtiquetaFiltro } =
  interfazSlice.actions;
export default interfazSlice.reducer;
