import { combineReducers, type UnknownAction } from '@reduxjs/toolkit';
import etiquetasReducer from './etiquetasSlice';
import familiaReducer from './familiaSlice';
import googleReducer from './googleSlice';
import notasReducer from './notasSlice';
import horarioReducer from './horarioSlice';
import interfazReducer from './interfazSlice';
import objetivosReducer from './objetivosSlice';
import pomodoroReducer from './pomodoroSlice';
import recordatoriosReducer from './recordatoriosSlice';
import sesionReducer, {
  cerrarSesion,
  iniciarSesionUsuario,
  registrarse,
  restaurarSesion,
} from './sesionSlice';
import tareasReducer from './tareasSlice';

const reductorCombinado = combineReducers({
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
});

type Estado = ReturnType<typeof reductorCombinado>;

// Acciones tras las que la cuenta activa cambia (o deja de haberla): los datos
// de la cuenta anterior no pueden seguir en memoria, o al entrar con otra
// cuenta en la misma pestaña se verían sus tareas, notas, etc. hasta que cada
// página las recargara (y en las que no recargan, para siempre).
function cambiaDeCuenta(accion: UnknownAction) {
  return (
    cerrarSesion.match(accion) ||
    iniciarSesionUsuario.fulfilled.match(accion) ||
    registrarse.fulfilled.match(accion) ||
    restaurarSesion.rejected.match(accion)
  );
}

export function reductorRaiz(estado: Estado | undefined, accion: UnknownAction): Estado {
  if (estado && cambiaDeCuenta(accion)) {
    // Solo sobreviven las preferencias de la interfaz (idioma, tema) y la
    // propia sesión; el resto vuelve a su estado inicial.
    const { interfaz, sesion } = estado;
    return reductorCombinado({ interfaz, sesion } as Estado, accion);
  }
  return reductorCombinado(estado, accion);
}
