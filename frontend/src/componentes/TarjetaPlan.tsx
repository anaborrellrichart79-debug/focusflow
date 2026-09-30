import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvisoPrecioPlus } from '@/componentes/AvisoPrecioPlus';
import { obtenerEstadoIa, type EstadoIa } from '@/servicios/planes';

// Qué plan tiene la cuenta y, con la IA incluida, cuántos usos lleva este
// mes. De momento solo informa: el cambio de plan (cobro) llegará después.
export function TarjetaPlan() {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [estado, setEstado] = useState<EstadoIa | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    obtenerEstadoIa(token)
      .then((respuesta) => vigente && setEstado(respuesta))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [token]);

  if (!estado) return null;

  const descripcion =
    estado.origen === 'PROPIO'
      ? 'ajustes.plan.pago'
      : estado.origen === 'FAMILIA'
        ? 'ajustes.plan.familiar'
        : 'ajustes.plan.gratuito';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {estado.incluida && <Sparkles aria-hidden className="size-4 text-primary" />}
          {intl.formatMessage({ id: 'ajustes.plan.titulo' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>{intl.formatMessage({ id: descripcion })}</p>
        {estado.desactivadaPorFamilia && (
          <p className="text-muted-foreground">{intl.formatMessage({ id: 'ia.desactivadaFamilia' })}</p>
        )}
        {estado.incluida ? (
          <p className="text-muted-foreground tabular-nums">
            {intl.formatMessage(
              { id: estado.compartidos ? 'ia.usosCompartidos' : 'ia.usos' },
              { usados: estado.usados, limite: estado.limite },
            )}
          </p>
        ) : (
          !estado.desactivadaPorFamilia && (
            <>
              <p className="text-muted-foreground">{intl.formatMessage({ id: 'ia.plus.explicacion' })}</p>
              <AvisoPrecioPlus />
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
