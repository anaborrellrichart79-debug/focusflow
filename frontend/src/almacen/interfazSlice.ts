import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { IDIOMA_POR_DEFECTO, IDIOMAS_DISPONIBLES, type CodigoIdioma } from '@/idiomas';
import type { Ambito } from '@/servicios/tareas';

export type Tema = 'claro' | 'oscuro';
export type AmbitoActivo = Ambito | 'TODOS';

const CLAVE_TEMA_LOCALSTORAGE = 'focusflow.tema';
const CLAVE_AMBITO_LOCALSTORAGE = 'focusflow.ambito';
const CLAVE_IDIOMA_LOCALSTORAGE = 'focusflow.idioma';

function idiomaGuardado(): CodigoIdioma | null {
  try {
    const guardado = localStorage.getItem(CLAVE_IDIOMA_LOCALSTORAGE);
    return IDIOMAS_DISPONIBLES.some((idioma) => idioma.codigo === guardado) ? (guardado as CodigoIdioma) : null;
  } catch {
    return null;
  }
}

// Si en este dispositivo no se ha elegido idioma, la app adopta el guardado
// en la cuenta (ver Aplicacion): así un móvil nuevo sale en tu idioma.
export function idiomaElegidoEnDispositivo() {
  return idiomaGuardado() !== null;
}

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
  idioma: idiomaGuardado() ?? IDIOMA_POR_DEFECTO,
  tema: obtenerTemaInicial(),
  ambitoActivo: obtenerAmbitoInicial(),
  etiquetaFiltro: null,
};

const interfazSlice = createSlice({
  name: 'interfaz',
  initialState: estadoInicial,
  reducers: {
    // Elección del usuario en el selector: se recuerda en este dispositivo.
    cambiarIdioma(estado, accion: PayloadAction<CodigoIdioma>) {
      estado.idioma = accion.payload;
      try {
        localStorage.setItem(CLAVE_IDIOMA_LOCALSTORAGE, accion.payload);
      } catch {
        /* almacenamiento no disponible */
      }
    },
    // El de la cuenta, en un dispositivo donde no se ha elegido ninguno. No se
    // recuerda: si entra otra cuenta, adopta el suyo.
    adoptarIdiomaDeCuenta(estado, accion: PayloadAction<CodigoIdioma>) {
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

export const { cambiarIdioma, adoptarIdiomaDeCuenta, alternarTema, cambiarAmbitoActivo, cambiarEtiquetaFiltro } =
  interfazSlice.actions;
export default interfazSlice.reducer;
