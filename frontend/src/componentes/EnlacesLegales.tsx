import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Enlaces a la política de privacidad y a las condiciones del servicio: en la
// portada, en el inicio de sesión y en Ajustes (y los pide Google para
// verificar la app).
export function EnlacesLegales({ className }: { className?: string }) {
  const intl = useIntl();
  return (
    <nav
      aria-label={intl.formatMessage({ id: 'legal.enlaces' })}
      className={cn('flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}
    >
      <Link to="/privacidad" className="hover:text-foreground hover:underline">
        {intl.formatMessage({ id: 'legal.privacidad' })}
      </Link>
      <Link to="/condiciones" className="hover:text-foreground hover:underline">
        {intl.formatMessage({ id: 'legal.condiciones' })}
      </Link>
    </nav>
  );
}
