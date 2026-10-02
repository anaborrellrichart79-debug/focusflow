import { Check, Sparkles } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BotonesContratarPlus } from '@/componentes/BotonesContratarPlus';
import { EnlacesLegales } from '@/componentes/EnlacesLegales';
import { SelectorIdioma } from '@/componentes/SelectorIdioma';
import { useEstadoIa } from '@/componentes/useEstadoIa';
import { formatearPrecio, LIMITE_USOS_PLUS, PRECIO_PLUS_ANUAL_EUROS, PRECIO_PLUS_EUROS } from '@/utilidades/planes';

const PUNTOS_PAGO = [
  'planes.pago.contratar',
  'planes.pago.renovar',
  'planes.pago.baja',
  'planes.pago.finPeriodo',
  'planes.pago.desistimiento',
  'planes.pago.cambios',
];

// Página pública (con o sin sesión) con los dos planes, el precio con IVA y
// cómo funcionan el pago, la renovación y la baja: el precio tiene que poder
// consultarse siempre, antes de contratar.
export function PaginaPlanes() {
  const intl = useIntl();
  const precio = (euros: number) => formatearPrecio(euros, intl.locale);
  const conSesion = usarSelector((estado) => Boolean(estado.sesion.usuario));
  const estadoIa = useEstadoIa();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-xl font-semibold tracking-tight text-transparent"
        >
          {intl.formatMessage({ id: 'app.titulo' })}
        </Link>
        <SelectorIdioma />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{intl.formatMessage({ id: 'planes.titulo' })}</h1>
        <p className="text-muted-foreground">{intl.formatMessage({ id: 'planes.intro' })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{intl.formatMessage({ id: 'planes.gratuito.nombre' })}</CardTitle>
            <p className="text-2xl font-semibold">{intl.formatMessage({ id: 'planes.gratuito.precio' })}</p>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'planes.gratuito.incluye' })}
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles aria-hidden className="size-4 text-primary" />
              {intl.formatMessage({ id: 'planes.plus.nombre' })}
            </CardTitle>
            <p className="text-2xl font-semibold">
              {intl.formatMessage({ id: 'planes.plus.mensual' }, { precio: precio(PRECIO_PLUS_EUROS) })}
            </p>
            <p className="text-sm">
              {intl.formatMessage(
                { id: 'planes.plus.anual' },
                { precio: precio(PRECIO_PLUS_ANUAL_EUROS), mensual: precio(PRECIO_PLUS_ANUAL_EUROS / 12) },
              )}
            </p>
            <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'planes.plus.iva' })}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>{intl.formatMessage({ id: 'planes.plus.incluye' }, { limite: LIMITE_USOS_PLUS })}</p>
            <p>{intl.formatMessage({ id: 'planes.plus.familia' }, { limite: LIMITE_USOS_PLUS })}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'planes.pago.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ul className="flex flex-col gap-2">
            {PUNTOS_PAGO.map((clave) => (
              <li key={clave} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {intl.formatMessage({ id: clave })}
              </li>
            ))}
          </ul>
          {!conSesion ? (
            <p className="font-medium">
              {intl.formatMessage(
                { id: 'planes.contratarSinSesion' },
                {
                  registro: (texto) => (
                    <Link to="/registro" className="text-primary hover:underline">
                      {texto}
                    </Link>
                  ),
                  login: (texto) => (
                    <Link to="/login" className="text-primary hover:underline">
                      {texto}
                    </Link>
                  ),
                },
              )}
            </p>
          ) : estadoIa?.origen ? (
            <p className="font-medium">
              {intl.formatMessage(
                { id: 'planes.yaTienesPlus' },
                {
                  ajustes: (texto) => (
                    <Link to="/ajustes" className="text-primary hover:underline">
                      {texto}
                    </Link>
                  ),
                },
              )}
            </p>
          ) : estadoIa?.puedeContratar ? (
            <BotonesContratarPlus />
          ) : (
            estadoIa && <p className="font-medium">{intl.formatMessage({ id: 'pagos.pideloAFamilia' })}</p>
          )}
          <p className="text-muted-foreground">
            {intl.formatMessage(
              { id: 'planes.verCondiciones' },
              {
                condiciones: (texto) => (
                  <Link to="/condiciones" className="text-primary hover:underline">
                    {texto}
                  </Link>
                ),
              },
            )}
          </p>
        </CardContent>
      </Card>

      <EnlacesLegales className="border-t border-border pt-4" />
    </main>
  );
}
