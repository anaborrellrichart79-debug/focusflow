import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  iniciarSesion as iniciarSesionApi,
  obtenerPerfil,
  registrarUsuario as registrarUsuarioApi,
  type UsuarioSesion,
} from '@/servicios/autenticacion';
import { ErrorApi } from '@/servicios/api';

const CLAVE_TOKEN_ALMACENAMIENTO = 'focusflow.tokenAcceso';

interface EstadoSesion {
  usuario: UsuarioSesion | null;
  tokenAcceso: string | null;
  cargando: boolean;
  restaurando: boolean;
  error: string | null;
}

function leerTokenGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN_ALMACENAMIENTO);
  } catch {
    return null;
  }
}

const tokenGuardadoAlIniciar = leerTokenGuardado();

const estadoInicial: EstadoSesion = {
  usuario: null,
  tokenAcceso: tokenGuardadoAlIniciar,
  cargando: false,
  restaurando: tokenGuardadoAlIniciar !== null,
  error: null,
};

export const restaurarSesion = createAsyncThunk(
  'sesion/restaurar',
  async (_: void, { rejectWithValue }) => {
    const tokenAcceso = leerTokenGuardado();
    if (!tokenAcceso) {
      return rejectWithValue(null);
    }
    try {
      const usuario = await obtenerPerfil(tokenAcceso);
      return { usuario, tokenAcceso };
    } catch {
      return rejectWithValue(null);
    }
  },
);

export const registrarse = createAsyncThunk(
  'sesion/registrarse',
  async (
    datos: {
      correo: string;
      contrasena: string;
      nombre?: string;
      fechaNacimiento: string;
      correoTutor?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await registrarUsuarioApi(datos);
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo completar el registro',
      );
    }
  },
);

export const iniciarSesionUsuario = createAsyncThunk(
  'sesion/iniciarSesion',
  async (datos: { correo: string; contrasena: string }, { rejectWithValue }) => {
    try {
      return await iniciarSesionApi(datos);
    } catch (error) {
      return rejectWithValue(
        error instanceof ErrorApi ? error.message : 'No se pudo iniciar sesión',
      );
    }
  },
);

const sesionSlice = createSlice({
  name: 'sesion',
  initialState: estadoInicial,
  reducers: {
    cerrarSesion(estado) {
      estado.usuario = null;
      estado.tokenAcceso = null;
      estado.error = null;
      try {
        localStorage.removeItem(CLAVE_TOKEN_ALMACENAMIENTO);
      } catch {
        /* almacenamiento no disponible (modo privado, etc.) */
      }
    },
  },
  extraReducers: (builder) => {
    function alPendiente(estado: EstadoSesion) {
      estado.cargando = true;
      estado.error = null;
    }

    function alCumplirse(
      estado: EstadoSesion,
      accion: { payload: { usuario: UsuarioSesion; tokenAcceso: string } },
    ) {
      estado.cargando = false;
      estado.usuario = accion.payload.usuario;
      estado.tokenAcceso = accion.payload.tokenAcceso;
      try {
        localStorage.setItem(CLAVE_TOKEN_ALMACENAMIENTO, accion.payload.tokenAcceso);
      } catch {
        /* almacenamiento no disponible (modo privado, etc.) */
      }
    }

    function alRechazarse(estado: EstadoSesion, accion: { payload?: unknown }) {
      estado.cargando = false;
      estado.error =
        typeof accion.payload === 'string'
          ? accion.payload
          : 'Ha ocurrido un error inesperado';
    }

    builder
      .addCase(registrarse.pending, alPendiente)
      .addCase(registrarse.fulfilled, alCumplirse)
      .addCase(registrarse.rejected, alRechazarse)
      .addCase(iniciarSesionUsuario.pending, alPendiente)
      .addCase(iniciarSesionUsuario.fulfilled, alCumplirse)
      .addCase(iniciarSesionUsuario.rejected, alRechazarse)
      .addCase(restaurarSesion.fulfilled, (estado, accion) => {
        estado.restaurando = false;
        estado.usuario = accion.payload.usuario;
        estado.tokenAcceso = accion.payload.tokenAcceso;
      })
      .addCase(restaurarSesion.rejected, (estado) => {
        estado.restaurando = false;
        estado.usuario = null;
        estado.tokenAcceso = null;
        try {
          localStorage.removeItem(CLAVE_TOKEN_ALMACENAMIENTO);
        } catch {
          /* almacenamiento no disponible (modo privado, etc.) */
        }
      });
  },
});

export const { cerrarSesion } = sesionSlice.actions;
export default sesionSlice.reducer;
