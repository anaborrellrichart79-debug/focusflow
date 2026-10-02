import { Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { marcarConsejoVisto, type ConsejoPlus as IdConsejo, type EstadoIa } from '@/servicios/planes';

// Consejo para contratar el Plus justo donde la IA ahorra trabajo (el horario
// vacío, los exámenes, los deberes, una tarea...). Cada uno sale una sola vez
// por cuenta: al enseñarlo se marca como visto en el servidor, así que
// tampoco vuelve a salir en otro dispositivo. Solo a cuentas adultas sin IA
// (puedeContratar): a los menores no se les enseña publicidad.
export function ConsejoPlus({ consejo, estadoIa }: { consejo: IdConsejo; estadoIa: EstadoIa | null }) {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  // Se decide una vez: si se marcara visto y se volviera a decidir con el
  // estado nuevo, desaparecería nada más salir.
  const [visible, setVisible] = useState(false);
  const decidido = useRef(false);

  useEffect(() => {
    if (decidido.current || !estadoIa || !token) return;
    decidido.current = true;
    if (!estadoIa.puedeContratar || estadoIa.consejosVistos?.includes(consejo)) return;
    setVisible(true);
    marcarConsejoVisto(token, consejo).catch(() => {});
  }, [estadoIa, token, consejo]);

  if (!visible) return null;

  return (
    <div
      role="note"
      className="relative flex flex-col gap-2 rounded-md border border-primary/40 bg-gradient-to-br from-primary/10 to-motivador/10 p-3 pr-9 text-sm"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-1.5 right-1.5"
        aria-label={intl.formatMessage({ id: 'consejos.cerrar' })}
        onClick={() => setVisible(false)}
      >
        <X aria-hidden />
      </Button>
      <span className="flex items-center gap-1.5 font-medium">
        <Sparkles aria-hidden className="size-4 shrink-0 text-primary" />
        {intl.formatMessage({ id: `consejos.${consejo}.titulo` })}
      </span>
      <p className="text-muted-foreground">{intl.formatMessage({ id: `consejos.${consejo}.texto` })}</p>
      <Link to="/planes" className="self-start font-medium text-primary hover:underline">
        {intl.formatMessage({ id: 'consejos.verPlus' })}
      </Link>
    </div>
  );
}
