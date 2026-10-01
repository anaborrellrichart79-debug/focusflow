import { CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { idAncla, temaDeRuta, TEXTOS_AYUDA } from '@/ayuda';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContenidoAyuda } from './ContenidoAyuda';

// Botón «?» flotante: abre la ayuda de la pantalla en la que se está. En el
// móvil sube por encima de la captura rápida, que ocupa todo el ancho abajo.
export function BotonAyuda() {
  const intl = useIntl();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const idioma = usarSelector((estado) => estado.interfaz.idioma);
  const [abierto, setAbierto] = useState(false);
  const tema = temaDeRuta(pathname);

  if (pathname === '/ayuda') return null;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={intl.formatMessage({ id: 'ayuda.boton' })}
        title={intl.formatMessage({ id: 'ayuda.boton' })}
        // Sin tema propio para esta pantalla, lleva a la ayuda completa.
        onClick={() => (tema ? setAbierto(true) : navegar('/ayuda'))}
        className="fixed right-4 bottom-20 z-40 size-10 rounded-full shadow-lg lg:bottom-6"
      >
        <CircleHelp aria-hidden className="size-5" />
      </Button>
      {tema && (
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{TEXTOS_AYUDA[idioma].temas[tema].titulo}</DialogTitle>
            </DialogHeader>
            <ContenidoAyuda tema={tema} />
            <Link
              to={`/ayuda#${idAncla(tema)}`}
              onClick={() => setAbierto(false)}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {intl.formatMessage({ id: 'ayuda.verTodo' })}
            </Link>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
