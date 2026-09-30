import { useEffect, useState } from 'react';
import { usarSelector } from '@/almacen/hooks';
import { obtenerEstadoIa, type EstadoIa } from '@/servicios/planes';

// Si la cuenta tiene la IA en su plan (null mientras se consulta). Se llama
// "use..." y no "usar..." porque React exige ese prefijo en los hooks propios
// (así el linter comprueba sus reglas). Si no se
// puede consultar, se da por incluida: la API ya responde con un error claro
// si el plan no la incluye.
export function useEstadoIa() {
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [estado, setEstado] = useState<EstadoIa | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    obtenerEstadoIa(token)
      .then((respuesta) => vigente && setEstado(respuesta))
      .catch(() => vigente && setEstado({ incluida: true, origen: null, usados: 0, limite: 0 }));
    return () => {
      vigente = false;
    };
  }, [token]);

  return estado;
}
