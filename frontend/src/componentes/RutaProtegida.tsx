import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';

export function RutaProtegida({ children }: { children: ReactNode }) {
  const usuario = usarSelector((estado) => estado.sesion.usuario);

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
