import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ErrorApi } from '@/servicios/api';
import { crearCheckout, irA, type PeriodoPlus } from '@/servicios/pagos';
import { formatearPrecio, PRECIO_PLUS_ANUAL_EUROS, PRECIO_PLUS_EUROS } from '@/utilidades/planes';

// Elegir mensual o anual y pasar a la página de pago de Stripe. El precio,
// con IVA, siempre a la vista antes de pulsar.
export function BotonesContratarPlus({ className }: { className?: string }) {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [periodo, setPeriodo] = useState<PeriodoPlus>('ANUAL');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const precio = (euros: number) => formatearPrecio(euros, intl.locale);

  async function contratar() {
    if (!token) return;
    setEnviando(true);
    setError(null);
    try {
      const { url } = await crearCheckout(token, periodo);
      irA(url);
    } catch (fallo) {
      setError(fallo instanceof ErrorApi ? fallo.message : intl.formatMessage({ id: 'pagos.error' }));
      setEnviando(false);
    }
  }

  const opciones: { valor: PeriodoPlus; titulo: string; detalle: string }[] = [
    {
      valor: 'ANUAL',
      titulo: intl.formatMessage({ id: 'pagos.anual' }, { precio: precio(PRECIO_PLUS_ANUAL_EUROS) }),
      detalle: intl.formatMessage({ id: 'pagos.anualDetalle' }, { mensual: precio(PRECIO_PLUS_ANUAL_EUROS / 12) }),
    },
    {
      valor: 'MENSUAL',
      titulo: intl.formatMessage({ id: 'pagos.mensual' }, { precio: precio(PRECIO_PLUS_EUROS) }),
      detalle: intl.formatMessage({ id: 'pagos.mensualDetalle' }),
    },
  ];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div role="radiogroup" aria-label={intl.formatMessage({ id: 'pagos.elegirPeriodo' })} className="grid gap-2 sm:grid-cols-2">
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={periodo === opcion.valor}
            onClick={() => setPeriodo(opcion.valor)}
            className={cn(
              'flex flex-col items-start rounded-md border p-3 text-left text-sm transition-colors',
              periodo === opcion.valor ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
            )}
          >
            <span className="font-medium">{opcion.titulo}</span>
            <span className="text-xs text-muted-foreground">{opcion.detalle}</span>
          </button>
        ))}
      </div>
      <Button onClick={contratar} disabled={enviando} className="self-start">
        <Sparkles aria-hidden />
        {intl.formatMessage({ id: enviando ? 'pagos.abriendo' : 'pagos.pasarAPlus' })}
      </Button>
      <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'pagos.aviso' })}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
