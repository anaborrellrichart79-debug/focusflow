import { CreditCard, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvisoPrecioPlus } from '@/componentes/AvisoPrecioPlus';
import { BotonesContratarPlus } from '@/componentes/BotonesContratarPlus';
import { ErrorApi } from '@/servicios/api';
import { abrirPortal, irA } from '@/servicios/pagos';
import { obtenerEstadoIa, type EstadoIa } from '@/servicios/planes';

// Al volver de pagar, el aviso de Stripe (webhook) puede tardar unos
// segundos en llegar al servidor: se vuelve a preguntar hasta que salga Plus.
const REINTENTOS_TRAS_PAGO = 10;
const ESPERA_TRAS_PAGO_MS = 2000;

// Qué plan tiene la cuenta y qué puede hacer: contratar Plus (adultos),
// gestionar la suscripción (baja, tarjeta, facturas) o ver los usos del mes.
export function TarjetaPlan() {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [parametros] = useSearchParams();
  const resultadoPago = parametros.get('pago');
  const [estado, setEstado] = useState<EstadoIa | null>(null);
  const [abriendoPortal, setAbriendoPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const consultar = (quedan: number) => {
      obtenerEstadoIa(token)
        .then((respuesta) => {
          if (!vigente) return;
          setEstado(respuesta);
          if (resultadoPago === 'ok' && !respuesta.incluida && quedan > 0) {
            temporizador = setTimeout(() => consultar(quedan - 1), ESPERA_TRAS_PAGO_MS);
          }
        })
        .catch(() => {});
    };
    consultar(REINTENTOS_TRAS_PAGO);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [token, resultadoPago]);

  async function gestionar() {
    if (!token) return;
    setAbriendoPortal(true);
    setError(null);
    try {
      irA((await abrirPortal(token)).url);
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.message : intl.formatMessage({ id: 'pagos.error' }));
      setAbriendoPortal(false);
    }
  }

  if (!estado) return null;

  const fecha = (iso: string) => intl.formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
  const conSuscripcion = estado.origen === 'PROPIO' && !estado.cortesia && Boolean(estado.plusHasta);
  const descripcion =
    estado.origen === 'PROPIO'
      ? 'ajustes.plan.pago'
      : estado.origen === 'FAMILIA'
        ? 'ajustes.plan.familiar'
        : 'ajustes.plan.gratuito';

  return (
    <Card id="plan">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {estado.incluida && <Sparkles aria-hidden className="size-4 text-primary" />}
          {intl.formatMessage({ id: 'ajustes.plan.titulo' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {resultadoPago === 'ok' && (
          <p role="status" className="rounded-md bg-primary/10 p-2 font-medium">
            {intl.formatMessage({ id: estado.incluida ? 'pagos.gracias' : 'pagos.procesando' })}
          </p>
        )}
        {resultadoPago === 'cancelado' && !estado.incluida && (
          <p role="status" className="text-muted-foreground">
            {intl.formatMessage({ id: 'pagos.cancelado' })}
          </p>
        )}
        <p>{intl.formatMessage({ id: descripcion })}</p>
        {estado.desactivadaPorFamilia && (
          <p className="text-muted-foreground">{intl.formatMessage({ id: 'ia.desactivadaFamilia' })}</p>
        )}
        {estado.pagoPendiente && (
          <p role="alert" className="text-destructive">
            {intl.formatMessage({ id: 'pagos.pendiente' })}
          </p>
        )}
        {conSuscripcion && estado.plusHasta && (
          <p className="text-muted-foreground">
            {intl.formatMessage(
              { id: estado.bajaAlFinalDelPeriodo ? 'pagos.hasta' : 'pagos.renueva' },
              { fecha: fecha(estado.plusHasta) },
            )}
          </p>
        )}
        {estado.incluida && (
          <p className="text-muted-foreground tabular-nums">
            {intl.formatMessage(
              { id: estado.compartidos ? 'ia.usosCompartidos' : 'ia.usos' },
              { usados: estado.usados, limite: estado.limite },
            )}
          </p>
        )}
        {conSuscripcion && (
          <Button variant="outline" className="self-start" onClick={gestionar} disabled={abriendoPortal}>
            <CreditCard aria-hidden />
            {intl.formatMessage({ id: abriendoPortal ? 'pagos.abriendo' : 'pagos.gestionar' })}
          </Button>
        )}
        {!estado.incluida && !estado.desactivadaPorFamilia && (
          <>
            <p className="text-muted-foreground">{intl.formatMessage({ id: 'ia.plus.explicacion' })}</p>
            {estado.puedeContratar ? (
              <BotonesContratarPlus className="mt-1" />
            ) : (
              <>
                <p className="text-muted-foreground">{intl.formatMessage({ id: 'pagos.pideloAFamilia' })}</p>
                <AvisoPrecioPlus />
              </>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
