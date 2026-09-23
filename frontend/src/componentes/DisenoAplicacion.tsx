import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarraLateral } from './BarraLateral';
import { CapturaRapida } from './CapturaRapida';
import { PantallaConsentimientoPendiente } from './PantallaConsentimientoPendiente';

// Marco común de todas las páginas con sesión iniciada: barra lateral fija en
// escritorio, cajón desplegable en el móvil, y la captura rápida abajo.
export function DisenoAplicacion({ children }: { children: ReactNode }) {
  const intl = useIntl();
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // La API ya bloquea con 403 a un menor sin confirmar (GuardaConsentimientoConfirmado);
  // esto es solo para explicárselo en vez de enseñarle páginas vacías con errores.
  if (usuario && !usuario.consentimientoConfirmado) {
    return <PantallaConsentimientoPendiente />;
  }

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        <Link
          to="/"
          className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-xl font-semibold tracking-tight text-transparent"
        >
          {intl.formatMessage({ id: 'app.titulo' })}
        </Link>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={intl.formatMessage({ id: menuAbierto ? 'nav.cerrarMenu' : 'nav.abrirMenu' })}
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {menuAbierto ? <X aria-hidden /> : <Menu aria-hidden />}
        </Button>
      </header>

      {menuAbierto && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background transition-transform md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <BarraLateral alNavegar={() => setMenuAbierto(false)} />
      </aside>

      <div className="min-w-0 flex-1 pb-20">{children}</div>
      {/* Con el cajón abierto se oculta: si no, tapa Ajustes y Cerrar sesión. */}
      {!menuAbierto && <CapturaRapida />}
    </div>
  );
}
