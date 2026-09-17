import { useDispatch, useSelector } from 'react-redux';
import type { Despachador, EstadoRaiz } from './store';

export const usarDespachador = useDispatch.withTypes<Despachador>();
export const usarSelector = useSelector.withTypes<EstadoRaiz>();
