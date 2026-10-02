import { BookOpen, CalendarClock, Camera, ListChecks, NotebookPen, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BotonesContratarPlus } from '@/componentes/BotonesContratarPlus';
import { useEstadoIa } from '@/componentes/useEstadoIa';
import { marcarConsejoVisto } from '@/servicios/planes';
import { LIMITE_USOS_PLUS } from '@/utilidades/planes';

// Para no repetir la ventana en la misma sesión: se guarda un trozo del token
// con el que ya se ha enseñado. Al volver a iniciar sesión el token cambia y
// sale otra vez (una vez por inicio de sesión), salvo "No volver a mostrar".
const CLAVE_MOSTRADA = 'focusflow.ofertaPlusMostrada';

function huella(token: string) {
  return token.slice(-24);
}

function yaMostrada(token: string) {
  try {
    return localStorage.getItem(CLAVE_MOSTRADA) === huella(token);
  } catch {
    return false;
  }
}

function recordarMostrada(token: string) {
  try {
    localStorage.setItem(CLAVE_MOSTRADA, huella(token));
  } catch {
    // Sin almacenamiento (navegación privada): como mucho, sale otra vez.
  }
}

const VENTAJAS = [
  { clave: 'horario', icono: Camera },
  { clave: 'examenes', icono: CalendarClock },
  { clave: 'deberes', icono: NotebookPen },
  { clave: 'pasos', icono: ListChecks },
  { clave: 'estudio', icono: BookOpen },
  { clave: 'familia', icono: Users },
] as const;

// Ventana con todo lo que añade el Plus, una vez al iniciar sesión. Solo a
// cuentas adultas sin IA (puedeContratar): a los menores, nunca.
export function OfertaPlus() {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const estadoIa = useEstadoIa();
  const [abierta, setAbierta] = useState(false);
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(false);
  const decidido = useRef(false);

  useEffect(() => {
    if (decidido.current || !estadoIa || !token) return;
    decidido.current = true;
    if (!estadoIa.puedeContratar || estadoIa.consejosVistos?.includes('oferta-inicio') || yaMostrada(token)) return;
    recordarMostrada(token);
    setAbierta(true);
  }, [estadoIa, token]);

  function alCambiarAbierta(valor: boolean) {
    setAbierta(valor);
    if (!valor && noVolverAMostrar && token) marcarConsejoVisto(token, 'oferta-inicio').catch(() => {});
  }

  if (!estadoIa) return null;

  return (
    <Dialog open={abierta} onOpenChange={alCambiarAbierta}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles aria-hidden className="size-5 text-primary" />
            {intl.formatMessage({ id: 'oferta.titulo' })}
          </DialogTitle>
          <DialogDescription>{intl.formatMessage({ id: 'oferta.subtitulo' })}</DialogDescription>
        </DialogHeader>

        {estadoIa.ofertaHasta && (
          <p className="rounded-md bg-motivador/15 p-2 text-sm font-medium">
            {intl.formatMessage(
              { id: estadoIa.ofertaCodigo ? 'oferta.lanzamientoCodigo' : 'oferta.lanzamiento' },
              {
                fecha: intl.formatDate(`${estadoIa.ofertaHasta}T12:00:00`, { day: 'numeric', month: 'long' }),
                codigo: estadoIa.ofertaCodigo ?? '',
              },
            )}
          </p>
        )}

        <ul className="flex flex-col gap-3 text-sm">
          {VENTAJAS.map(({ clave, icono: Icono }) => (
            <li key={clave} className="flex gap-3">
              <Icono aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="font-medium">{intl.formatMessage({ id: `oferta.${clave}.titulo` })}</span>{' '}
                <span className="text-muted-foreground">
                  {intl.formatMessage({ id: `oferta.${clave}.texto` }, { limite: LIMITE_USOS_PLUS })}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <BotonesContratarPlus />

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={noVolverAMostrar} onCheckedChange={(valor) => setNoVolverAMostrar(valor === true)} />
            {intl.formatMessage({ id: 'oferta.noVolverAMostrar' })}
          </label>
          <Button variant="ghost" onClick={() => alCambiarAbierta(false)}>
            {intl.formatMessage({ id: 'oferta.ahoraNo' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
