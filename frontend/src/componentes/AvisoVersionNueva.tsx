import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@/components/ui/button';

// Cada cuánto se pregunta, con la app abierta, si se ha publicado otra versión.
const INTERVALO_MS = 10 * 60 * 1000;

// /version.json lo genera cada compilación (vite.config.ts) con el mismo
// identificador que lleva el código: si no coinciden, hay una versión nueva.
async function hayVersionNueva() {
  try {
    const respuesta = await fetch('/version.json', { cache: 'no-store' });
    if (!respuesta.ok) return false;
    const { version } = (await respuesta.json()) as { version?: unknown };
    return typeof version === 'string' && version !== __VERSION_APP__;
  } catch {
    return false;
  }
}

// Franja arriba de todo cuando se ha publicado una versión nueva mientras la
// app seguía abierta (o en segundo plano en el móvil): recargar la trae.
// Solo en producción: en desarrollo Vite ya recarga solo.
export function AvisoVersionNueva({ activo = import.meta.env.PROD }: { activo?: boolean }) {
  const intl = useIntl();
  const [nueva, setNueva] = useState(false);

  useEffect(() => {
    if (!activo || nueva) return;
    let vigente = true;
    const comprobar = () => {
      hayVersionNueva().then((hay) => {
        if (vigente && hay) setNueva(true);
      });
    };
    // Al volver a la app (otra pestaña, o sacarla del segundo plano en el
    // móvil) es cuando más probable es que lleve rato sin comprobarlo.
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') comprobar();
    };
    const intervalo = setInterval(comprobar, INTERVALO_MS);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      vigente = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [activo, nueva]);

  if (!nueva) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 border-b border-border bg-primary/10 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2">
        <RefreshCw aria-hidden className="size-4 shrink-0 text-primary" />
        {intl.formatMessage({ id: 'actualizacion.texto' })}
      </p>
      <Button size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => window.location.reload()}>
        {intl.formatMessage({ id: 'actualizacion.boton' })}
      </Button>
    </div>
  );
}
