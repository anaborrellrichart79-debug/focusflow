import { Siren } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarAvisos, marcarAvisosMostrados, revisarTarea } from '@/almacen/recordatoriosSlice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Aviso } from '@/servicios/recordatorios';
import { textoAviso } from '@/utilidades/avisos';
import { reproducirAlarmaEmergencia, reproducirAvisoRecordatorio } from '@/utilidades/sonido';

// Cada cuánto se preguntan al backend los avisos nuevos mientras la app está
// abierta (el backend los genera cada 5 minutos).
export const INTERVALO_CONSULTA_AVISOS_MS = 60 * 1000;

function notificacionesPermitidas() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// Sin interfaz propia salvo la alarma de emergencia: consulta los avisos cada
// minuto, hace sonar y enseña como notificación del navegador los que aún no
// se han mostrado, y abre la alarma mientras haya emergencias sin atender.
export function VigilanteAvisos() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const navegar = useNavigate();
  const avisos = usarSelector((estado) => estado.recordatorios.avisos);
  const [pospuestas, setPospuestas] = useState<Set<string>>(new Set());

  useEffect(() => {
    despachar(cargarAvisos());
    const intervalo = setInterval(() => despachar(cargarAvisos()), INTERVALO_CONSULTA_AVISOS_MS);
    return () => clearInterval(intervalo);
  }, [despachar]);

  useEffect(() => {
    const nuevos = avisos.filter((aviso) => !aviso.mostradoEn && !aviso.leidoEn);
    if (nuevos.length === 0) return;

    const hayEmergencia = nuevos.some((aviso) => aviso.tipo === 'EMERGENCIA');
    if (hayEmergencia) reproducirAlarmaEmergencia();
    else reproducirAvisoRecordatorio();

    if (notificacionesPermitidas()) {
      const { titulo, cuerpo } =
        nuevos.length === 1
          ? textoAviso(intl, nuevos[0])
          : {
              titulo: intl.formatMessage({ id: 'avisos.notificacion.varios' }, { cantidad: nuevos.length }),
              cuerpo: nuevos.map((aviso) => textoAviso(intl, aviso).titulo).join('\n'),
            };
      const notificacion = new Notification(titulo, {
        body: cuerpo,
        tag: 'focusflow-avisos',
        // Una alarma de emergencia se queda en pantalla hasta que se atiende.
        requireInteraction: hayEmergencia,
      });
      // Una petición de revisión se atiende en Familia; lo demás, en Recordatorios.
      const destino =
        nuevos.length === 1 && nuevos[0].tipo === 'REVISION_SOLICITADA' ? '/familia' : '/recordatorios';
      notificacion.onclick = () => {
        window.focus();
        navegar(destino);
        notificacion.close();
      };
    }

    despachar(marcarAvisosMostrados(nuevos.map((aviso) => aviso.id)));
  }, [avisos, despachar, intl, navegar]);

  const emergencias = useMemo(
    () =>
      avisos.filter(
        (aviso): aviso is Extract<Aviso, { tipo: 'EMERGENCIA' }> =>
          aviso.tipo === 'EMERGENCIA' && !aviso.leidoEn,
      ),
    [avisos],
  );
  const alarmaAbierta = emergencias.some((aviso) => !pospuestas.has(aviso.id));
  const mensajeIa = emergencias.find((aviso) => aviso.mensajeIa)?.mensajeIa;

  function posponer() {
    setPospuestas(new Set(emergencias.map((aviso) => aviso.id)));
  }

  return (
    <Dialog open={alarmaAbierta} onOpenChange={(abierta) => !abierta && posponer()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-destructive sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Siren aria-hidden className="size-5" />
            {intl.formatMessage({ id: 'avisos.emergencia.titulo' })}
          </DialogTitle>
          <DialogDescription>
            {intl.formatMessage({ id: 'avisos.emergencia.descripcion' }, { cantidad: emergencias.length })}
          </DialogDescription>
        </DialogHeader>

        {mensajeIa && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm italic">{mensajeIa}</p>
        )}

        <ul className="flex flex-col gap-2">
          {emergencias.map((aviso) => (
            <li
              key={aviso.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{aviso.datos.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {intl.formatMessage(
                    { id: 'avisos.emergencia.diasSinTocar' },
                    { dias: aviso.datos.diasSinTocar },
                  )}
                </p>
              </div>
              {aviso.tareaId && (
                <Button size="sm" variant="outline" onClick={() => despachar(revisarTarea(aviso.tareaId!))}>
                  {intl.formatMessage({ id: 'avisos.emergencia.revisada' })}
                </Button>
              )}
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" asChild onClick={posponer}>
            <Link to="/kanban">{intl.formatMessage({ id: 'avisos.emergencia.irKanban' })}</Link>
          </Button>
          <Button variant="ghost" onClick={posponer}>
            {intl.formatMessage({ id: 'avisos.emergencia.posponer' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
