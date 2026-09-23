import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { CapturaRapida } from './CapturaRapida';
import { SelectorAmbito } from './SelectorAmbito';

export function RutaProtegida({ children }: { children: ReactNode }) {
  const usuario = usarSelector((estado) => estado.sesion.usuario);

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Provisional hasta la barra lateral de la Fase D, que lo absorberá. */}
      <div className="flex justify-center px-4 pt-4">
        <SelectorAmbito />
      </div>
      {children}
      <CapturaRapida />
    </>
  );
}
