import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { crearSubtareaTarea, crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AvisoPrecioPlus } from '@/componentes/AvisoPrecioPlus';
import { ErrorApi } from '@/servicios/api';
import { proponerPlanEstudio, proponerSubtareas } from '@/servicios/asistente';
import { obtenerEstadoIa, type EstadoIa } from '@/servicios/planes';
import type { Tarea } from '@/servicios/tareas';
import { combinarFechaYHora } from '@/utilidades/fechas';

interface Propuesta {
  titulo: string;
  elegida: boolean;
  // Solo en el plan de estudio.
  fecha?: string;
  minutos?: number;
}

type Modo = 'pasos' | 'plan';

// Botones de la ficha de una tarea que piden a la IA una propuesta:
// dividirla en pasos (subtareas) o un plan de estudio día a día hasta su
// fecha límite (una tarea por sesión, que sale en la Agenda). La propuesta se
// puede retocar y desmarcar antes de añadirla; nada se guarda sin aceptar.
export function AsistenteIa({ tarea }: { tarea: Tarea }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [modo, setModo] = useState<Modo | null>(null);
  const [pensando, setPensando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [anadidas, setAnadidas] = useState<number | null>(null);
  // null mientras se consulta: sin plan con IA se enseña qué incluye Plus en
  // lugar de unos botones que solo darían error.
  const [estadoIa, setEstadoIa] = useState<EstadoIa | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    obtenerEstadoIa(token)
      .then((estado) => vigente && setEstadoIa(estado))
      // Si no se puede consultar, se dejan los botones: la API ya responde
      // con un error claro si el plan no incluye la IA.
      .catch(() => vigente && setEstadoIa({ incluida: true, origen: null, usados: 0, limite: 0 }));
    return () => {
      vigente = false;
    };
  }, [token]);

  async function pedir(nuevoModo: Modo) {
    if (!token) return;
    setModo(nuevoModo);
    setPensando(true);
    setError(null);
    setAnadidas(null);
    setPropuestas([]);
    try {
      if (nuevoModo === 'pasos') {
        const { pasos } = await proponerSubtareas(token, tarea.id);
        setPropuestas(pasos.map((titulo) => ({ titulo, elegida: true })));
      } else {
        const { sesiones } = await proponerPlanEstudio(token, tarea.id);
        setPropuestas(sesiones.map((sesion) => ({ ...sesion, elegida: true })));
      }
      setEstadoIa((estado) => (estado ? { ...estado, usados: estado.usados + 1 } : estado));
    } catch (causa) {
      setError(causa instanceof ErrorApi ? causa.message : intl.formatMessage({ id: 'ia.error' }));
      setModo(null);
    } finally {
      setPensando(false);
    }
  }

  function cambiar(indice: number, cambios: Partial<Propuesta>) {
    setPropuestas((actuales) => actuales.map((p, i) => (i === indice ? { ...p, ...cambios } : p)));
  }

  async function aceptar() {
    const elegidas = propuestas.filter((p) => p.elegida && p.titulo.trim());
    setGuardando(true);
    // Una detrás de otra para que las subtareas queden en el orden propuesto.
    for (const propuesta of elegidas) {
      if (modo === 'pasos') {
        await despachar(crearSubtareaTarea({ tareaId: tarea.id, titulo: propuesta.titulo.trim() }));
      } else {
        await despachar(
          crearTarea({
            titulo: propuesta.titulo.trim(),
            fechaLimite: combinarFechaYHora(propuesta.fecha!, ''),
            tiempoEstimadoMinutos: propuesta.minutos,
            ambito: tarea.ambito,
            objetivoId: tarea.objetivoId ?? undefined,
            asignaturaHorarioId: tarea.asignaturaHorarioId ?? undefined,
            etiquetas: tarea.etiquetas.map((etiqueta) => etiqueta.nombre),
          }),
        );
      }
    }
    setGuardando(false);
    setAnadidas(elegidas.length);
    setModo(null);
    setPropuestas([]);
  }

  const elegidas = propuestas.filter((p) => p.elegida && p.titulo.trim()).length;

  if (!estadoIa) return null;

  if (estadoIa.desactivadaPorFamilia) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
        <Sparkles aria-hidden className="size-4 shrink-0" />
        {intl.formatMessage({ id: 'ia.desactivadaFamilia' })}
      </div>
    );
  }

  if (!estadoIa.incluida) {
    return (
      <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles aria-hidden className="size-4 text-primary" />
          {intl.formatMessage({ id: 'ia.plus.titulo' })}
        </span>
        <p className="text-muted-foreground">{intl.formatMessage({ id: 'ia.plus.explicacion' })}</p>
        <AvisoPrecioPlus />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles aria-hidden className="size-4 text-primary" />
        {intl.formatMessage({ id: 'ia.titulo' })}
        {estadoIa.limite > 0 && (
          <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
            {intl.formatMessage({ id: 'ia.usos' }, { usados: estadoIa.usados, limite: estadoIa.limite })}
          </span>
        )}
      </span>

      {!modo && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => pedir('pasos')} disabled={pensando}>
            {intl.formatMessage({ id: 'ia.dividir' })}
          </Button>
          {tarea.fechaLimite && (
            <Button variant="outline" size="sm" onClick={() => pedir('plan')} disabled={pensando}>
              {intl.formatMessage({ id: 'ia.plan' })}
            </Button>
          )}
        </div>
      )}

      {pensando && (
        <p role="status" className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'ia.pensando' })}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {anadidas !== null && (
        <p role="status" className="text-sm text-primary">
          {intl.formatMessage({ id: 'ia.anadidas' }, { cantidad: anadidas })}
        </p>
      )}

      {modo && propuestas.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {intl.formatMessage({ id: modo === 'pasos' ? 'ia.revisaPasos' : 'ia.revisaPlan' })}
          </p>
          <ul className="flex flex-col gap-1.5">
            {propuestas.map((propuesta, indice) => (
              <li key={indice} className="flex items-center gap-2">
                <Checkbox
                  checked={propuesta.elegida}
                  aria-label={intl.formatMessage({ id: 'ia.incluir' }, { titulo: propuesta.titulo })}
                  onCheckedChange={(marcada) => cambiar(indice, { elegida: marcada === true })}
                />
                {propuesta.fecha && (
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {intl.formatDate(`${propuesta.fecha}T00:00:00.000Z`, {
                      timeZone: 'UTC',
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
                <Input
                  value={propuesta.titulo}
                  onChange={(evento) => cambiar(indice, { titulo: evento.target.value })}
                  aria-label={intl.formatMessage({ id: 'ia.editar' })}
                  className="h-8 text-sm"
                />
                {propuesta.minutos !== undefined && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {intl.formatMessage({ id: 'ia.minutos' }, { minutos: propuesta.minutos })}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={aceptar} disabled={guardando || elegidas === 0}>
              {intl.formatMessage(
                { id: modo === 'pasos' ? 'ia.anadirPasos' : 'ia.anadirPlan' },
                { cantidad: elegidas },
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => pedir(modo)} disabled={guardando}>
              {intl.formatMessage({ id: 'ia.otraPropuesta' })}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setModo(null);
                setPropuestas([]);
              }}
              disabled={guardando}
            >
              {intl.formatMessage({ id: 'ia.descartar' })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
