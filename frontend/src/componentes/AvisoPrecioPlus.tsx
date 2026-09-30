import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { formatearPrecio, PRECIO_PLUS_ANUAL_EUROS, PRECIO_PLUS_EUROS } from '@/utilidades/planes';

// Precio de Plus y enlace a la página de planes, allí donde la app lo ofrece:
// el precio tiene que estar siempre a la vista antes de contratar.
export function AvisoPrecioPlus() {
  const intl = useIntl();
  return (
    <p className="text-xs text-muted-foreground">
      {intl.formatMessage(
        { id: 'planes.resumen' },
        {
          mensual: formatearPrecio(PRECIO_PLUS_EUROS, intl.locale),
          anual: formatearPrecio(PRECIO_PLUS_ANUAL_EUROS, intl.locale),
        },
      )}{' '}
      {intl.formatMessage({ id: 'planes.proximamente' })}{' '}
      <Link to="/planes" className="text-primary hover:underline">
        {intl.formatMessage({ id: 'planes.ver' })}
      </Link>
    </p>
  );
}
