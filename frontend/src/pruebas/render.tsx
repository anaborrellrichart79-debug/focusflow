import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import etiquetasReducer from '@/almacen/etiquetasSlice';
import familiaReducer from '@/almacen/familiaSlice';
import googleReducer from '@/almacen/googleSlice';
import notasReducer from '@/almacen/notasSlice';
import horarioReducer from '@/almacen/horarioSlice';
import interfazReducer from '@/almacen/interfazSlice';
import objetivosReducer from '@/almacen/objetivosSlice';
import pomodoroReducer from '@/almacen/pomodoroSlice';
import recordatoriosReducer from '@/almacen/recordatoriosSlice';
import sesionReducer from '@/almacen/sesionSlice';
import type { EstadoRaiz } from '@/almacen/store';
import tareasReducer from '@/almacen/tareasSlice';
import { es } from '@/idiomas/es';

const reductorRaiz = {
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
};

export function crearTiendaDePrueba(estadoPrecargado?: Partial<EstadoRaiz>) {
  return configureStore({
    reducer: reductorRaiz,
    // Cast pragmático: en tiempo de ejecución, combineReducers admite
    // perfectamente un preloadedState parcial (usa el estado inicial de cada
    // reducer para las claves ausentes), pero el tipo generado por RTK exige
    // el shape completo.
    preloadedState: estadoPrecargado as EstadoRaiz,
  });
}

// Estado de sesión con token, para páginas protegidas que despachan thunks al
// montarse: con token, esos thunks intentan llamar a fetch de verdad (hay que
// mockearlo). Sin token (el valor por defecto en crearTiendaDePrueba), esos
// mismos thunks se rechazan al instante con "No autenticado" sin tocar la
// red, lo cual es justo lo que interesa en tests que solo quieren comprobar
// cómo se renderiza un estado ya precargado.
export const SESION_AUTENTICADA: EstadoRaiz['sesion'] = {
  usuario: {
    id: 'usuario-1',
    correo: 'ana@example.com',
    nombre: 'Ana',
    consentimientoConfirmado: true,
    modoEscolarActivo: false,
  },
  tokenAcceso: 'token-de-prueba',
  cargando: false,
  restaurando: false,
  error: null,
};

// Igual que SESION_AUTENTICADA pero con el modo escolar activado en Ajustes:
// hace falta para todo lo que depende del ámbito (selector, filtros, campos
// de ámbito y tipo del detalle de una tarea).
export const SESION_MODO_ESCOLAR: EstadoRaiz['sesion'] = {
  ...SESION_AUTENTICADA,
  usuario: { ...SESION_AUTENTICADA.usuario!, modoEscolarActivo: true },
};

export function renderizarPagina(
  ui: ReactElement,
  {
    estadoPrecargado,
    ruta = '/',
  }: { estadoPrecargado?: Partial<EstadoRaiz>; ruta?: string } = {},
) {
  const tienda = crearTiendaDePrueba(estadoPrecargado);
  const resultado = render(
    <Provider store={tienda}>
      <IntlProvider locale="es" messages={es}>
        <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
      </IntlProvider>
    </Provider>,
  );
  return { ...resultado, tienda };
}
