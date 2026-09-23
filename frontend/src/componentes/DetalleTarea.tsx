import { useEffect, useId, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarHistorialPomodoro } from '@/almacen/pomodoroSlice';
import {
  cambiarAmbitoTarea,
  cambiarAsignaturaTarea,
  cambiarDescripcionTarea,
  cambiarEtiquetasTarea,
  cambiarFechaLimiteTarea,
  cambiarRecurrenciaTarea,
  cambiarSubtarea,
  cambiarTiempoEstimadoTarea,
  cambiarTipoEscolarTarea,
  crearSubtareaTarea,
  eliminarSubtareaTarea,
} from '@/almacen/tareasSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Ambito, Recurrencia, Tarea, TipoEscolar } from '@/servicios/tareas';
import { OPCIONES_TIPO_ESCOLAR } from '@/utilidades/planificador';
import {
  DURACION_MINUTOS_POR_DEFECTO,
  combinarFechaYHora,
  obtenerSoloFecha,
  obtenerSoloHora,
} from '@/utilidades/fechas';

const OPCIONES_AMBITO: { valor: Ambito; clave: string }[] = [
  { valor: 'PERSONAL', clave: 'ambito.personal' },
  { valor: 'ESCOLAR', clave: 'ambito.escolar' },
];

const OPCIONES_RECURRENCIA: { valor: Recurrencia; clave: string }[] = [
  { valor: 'NINGUNA', clave: 'tarea.recurrencia.ninguna' },
  { valor: 'DIARIA', clave: 'tarea.recurrencia.diaria' },
  { valor: 'SEMANAL', clave: 'tarea.recurrencia.semanal' },
];

export function DetalleTarea({ tarea, className }: { tarea: Tarea; className?: string }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const etiquetasConocidas = usarSelector((estado) => estado.etiquetas.lista);
  const historialPomodoro = usarSelector((estado) => estado.pomodoro.historial);
  const modoEscolar = usarSelector((estado) => estado.sesion.usuario?.modoEscolarActivo ?? false);
  const asignaturasHorario = usarSelector((estado) => estado.horario.activo?.asignaturas);
  const idDatalist = useId();

  // Asignaturas del horario activo; si la tarea tiene una de otro horario
  // (p. ej. del curso pasado), se añade para que el desplegable la muestre.
  const opcionesAsignatura = (asignaturasHorario ?? []).map((elegida) => ({
    id: elegida.id,
    nombre: elegida.asignatura.nombre,
  }));
  if (
    tarea.asignaturaHorario &&
    !opcionesAsignatura.some((opcion) => opcion.id === tarea.asignaturaHorario!.id)
  ) {
    opcionesAsignatura.push({
      id: tarea.asignaturaHorario.id,
      nombre: tarea.asignaturaHorario.asignatura.nombre,
    });
  }

  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? '');
  const [tiempoEstimado, setTiempoEstimado] = useState(
    tarea.tiempoEstimadoMinutos?.toString() ?? '',
  );
  const [fecha, setFecha] = useState(tarea.fechaLimite ? obtenerSoloFecha(tarea.fechaLimite) : '');
  const [hora, setHora] = useState(tarea.fechaLimite ? obtenerSoloHora(tarea.fechaLimite) : '');
  const [duracion, setDuracion] = useState(
    (tarea.duracionMinutos ?? DURACION_MINUTOS_POR_DEFECTO).toString(),
  );
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  useEffect(() => {
    if (abierto) despachar(cargarHistorialPomodoro());
  }, [abierto, despachar]);

  function alCambiarAbierto(valor: boolean) {
    setAbierto(valor);
    if (valor) {
      setDescripcion(tarea.descripcion ?? '');
      setTiempoEstimado(tarea.tiempoEstimadoMinutos?.toString() ?? '');
      setFecha(tarea.fechaLimite ? obtenerSoloFecha(tarea.fechaLimite) : '');
      setHora(tarea.fechaLimite ? obtenerSoloHora(tarea.fechaLimite) : '');
      setDuracion((tarea.duracionMinutos ?? DURACION_MINUTOS_POR_DEFECTO).toString());
    }
  }

  function guardarDescripcion() {
    if (descripcion !== (tarea.descripcion ?? '')) {
      despachar(cambiarDescripcionTarea({ id: tarea.id, descripcion }));
    }
  }

  function guardarTiempoEstimado() {
    const minutos = Number.parseInt(tiempoEstimado, 10);
    if (Number.isFinite(minutos) && minutos > 0 && minutos !== tarea.tiempoEstimadoMinutos) {
      despachar(cambiarTiempoEstimadoTarea({ id: tarea.id, tiempoEstimadoMinutos: minutos }));
    }
  }

  function guardarFechaLimite() {
    if (!fecha) return;
    const fechaLimite = combinarFechaYHora(fecha, hora);
    const duracionMinutos = hora ? Number.parseInt(duracion, 10) || undefined : undefined;
    if (
      fechaLimite !== tarea.fechaLimite ||
      (hora && duracionMinutos !== (tarea.duracionMinutos ?? undefined))
    ) {
      despachar(cambiarFechaLimiteTarea({ id: tarea.id, fechaLimite, duracionMinutos }));
    }
  }

  const tiempoRealMinutos = Math.round(
    historialPomodoro
      .filter((sesion) => sesion.fase === 'TRABAJO' && sesion.tareaId === tarea.id)
      .reduce((total, sesion) => total + sesion.duracionSegundos, 0) / 60,
  );

  function alAnadirEtiqueta(evento: React.FormEvent) {
    evento.preventDefault();
    const nombre = nuevaEtiqueta.trim();
    if (!nombre || tarea.etiquetas.some((etiqueta) => etiqueta.nombre === nombre)) return;
    despachar(
      cambiarEtiquetasTarea({
        id: tarea.id,
        etiquetas: [...tarea.etiquetas.map((etiqueta) => etiqueta.nombre), nombre],
      }),
    );
    setNuevaEtiqueta('');
  }

  function quitarEtiqueta(nombre: string) {
    despachar(
      cambiarEtiquetasTarea({
        id: tarea.id,
        etiquetas: tarea.etiquetas
          .map((etiqueta) => etiqueta.nombre)
          .filter((existente) => existente !== nombre),
      }),
    );
  }

  function alAnadirSubtarea(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nuevaSubtarea.trim()) return;
    despachar(crearSubtareaTarea({ tareaId: tarea.id, titulo: nuevaSubtarea }));
    setNuevaSubtarea('');
  }

  const subtareasCompletadas = tarea.subtareas.filter((subtarea) => subtarea.completada).length;

  return (
    <>
      <button
        type="button"
        onClick={() => alCambiarAbierto(true)}
        className={className ?? 'text-left text-sm hover:underline'}
      >
        {tarea.titulo}
      </button>

      <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tarea.titulo}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'tarea.detalle.descripcion' })}
              <Textarea
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                onBlur={guardarDescripcion}
                rows={3}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {intl.formatMessage({ id: 'tarea.detalle.fechaLimite' })}
              </span>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={fecha}
                  onChange={(evento) => setFecha(evento.target.value)}
                  onBlur={guardarFechaLimite}
                  aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
                />
                <Input
                  type="time"
                  value={hora}
                  onChange={(evento) => setHora(evento.target.value)}
                  onBlur={guardarFechaLimite}
                  aria-label={intl.formatMessage({ id: 'tarea.detalle.horaInicio' })}
                  className="max-w-28"
                />
              </div>
              {hora && (
                <label className="flex flex-col gap-1.5 text-sm">
                  {intl.formatMessage({ id: 'tarea.detalle.duracion' })}
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={duracion}
                    onChange={(evento) => setDuracion(evento.target.value)}
                    onBlur={guardarFechaLimite}
                    className="max-w-32"
                  />
                </label>
              )}
            </div>

            {modoEscolar && (
              <label className="flex flex-col gap-1.5 text-sm">
                {intl.formatMessage({ id: 'tarea.detalle.ambito' })}
                <select
                  value={tarea.ambito}
                  onChange={(evento) =>
                    despachar(
                      cambiarAmbitoTarea({ id: tarea.id, ambito: evento.target.value as Ambito }),
                    )
                  }
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  {OPCIONES_AMBITO.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {intl.formatMessage({ id: opcion.clave })}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {modoEscolar && tarea.ambito === 'ESCOLAR' && (
              <label className="flex flex-col gap-1.5 text-sm">
                {intl.formatMessage({ id: 'tarea.detalle.tipoEscolar' })}
                <select
                  value={tarea.tipoEscolar ?? ''}
                  onChange={(evento) =>
                    despachar(
                      cambiarTipoEscolarTarea({
                        id: tarea.id,
                        tipoEscolar: (evento.target.value || null) as TipoEscolar | null,
                      }),
                    )
                  }
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  <option value="">{intl.formatMessage({ id: 'tipoEscolar.ninguno' })}</option>
                  {OPCIONES_TIPO_ESCOLAR.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.icono} {intl.formatMessage({ id: opcion.clave })}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {modoEscolar && tarea.ambito === 'ESCOLAR' && opcionesAsignatura.length > 0 && (
              <label className="flex flex-col gap-1.5 text-sm">
                {intl.formatMessage({ id: 'tarea.detalle.asignatura' })}
                <select
                  value={tarea.asignaturaHorarioId ?? ''}
                  onChange={(evento) =>
                    despachar(
                      cambiarAsignaturaTarea({
                        id: tarea.id,
                        asignaturaHorarioId: evento.target.value || null,
                      }),
                    )
                  }
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  <option value="">{intl.formatMessage({ id: 'tarea.detalle.sinAsignatura' })}</option>
                  {opcionesAsignatura.map((opcion) => (
                    <option key={opcion.id} value={opcion.id}>
                      {opcion.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'tarea.detalle.recurrencia' })}
              <select
                value={tarea.recurrencia}
                onChange={(evento) =>
                  despachar(
                    cambiarRecurrenciaTarea({
                      id: tarea.id,
                      recurrencia: evento.target.value as Recurrencia,
                    }),
                  )
                }
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
              >
                {OPCIONES_RECURRENCIA.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {intl.formatMessage({ id: opcion.clave })}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tiempo-estimado" className="text-sm">
                {intl.formatMessage({ id: 'tarea.detalle.tiempoEstimado' })}
              </label>
              <Input
                id="tiempo-estimado"
                type="number"
                min={1}
                max={1000}
                value={tiempoEstimado}
                onChange={(evento) => setTiempoEstimado(evento.target.value)}
                onBlur={guardarTiempoEstimado}
                placeholder={intl.formatMessage({ id: 'tarea.detalle.tiempoEstimadoPlaceholder' })}
                className="max-w-32"
              />
              {tarea.tiempoEstimadoMinutos != null && tiempoRealMinutos > 0 && (
                <p
                  className={
                    tiempoRealMinutos > tarea.tiempoEstimadoMinutos
                      ? 'text-sm text-destructive'
                      : 'text-sm text-exito'
                  }
                >
                  {intl.formatMessage(
                    { id: 'tarea.detalle.tiempoReal' },
                    { minutos: tiempoRealMinutos },
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {intl.formatMessage({ id: 'tarea.detalle.etiquetas' })}
              </span>
              {tarea.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tarea.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta.id} variant="secondary" className="gap-1">
                      {etiqueta.nombre}
                      <button
                        type="button"
                        aria-label={intl.formatMessage(
                          { id: 'tarea.detalle.quitarEtiqueta' },
                          { nombre: etiqueta.nombre },
                        )}
                        onClick={() => quitarEtiqueta(etiqueta.nombre)}
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <form onSubmit={alAnadirEtiqueta} className="flex gap-2">
                <Input
                  value={nuevaEtiqueta}
                  onChange={(evento) => setNuevaEtiqueta(evento.target.value)}
                  placeholder={intl.formatMessage({ id: 'tarea.detalle.nuevaEtiqueta' })}
                  list={idDatalist}
                />
                <datalist id={idDatalist}>
                  {etiquetasConocidas.map((etiqueta) => (
                    <option key={etiqueta.id} value={etiqueta.nombre} />
                  ))}
                </datalist>
                <Button type="submit" size="sm">
                  {intl.formatMessage({ id: 'tareas.anadir' })}
                </Button>
              </form>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                {intl.formatMessage(
                  { id: 'tarea.detalle.subtareas' },
                  { completadas: subtareasCompletadas, total: tarea.subtareas.length },
                )}
              </span>
              {tarea.subtareas.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {tarea.subtareas.map((subtarea) => (
                    <li key={subtarea.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={subtarea.completada}
                        aria-label={intl.formatMessage(
                          { id: 'tareas.marcarCompletada' },
                          { titulo: subtarea.titulo },
                        )}
                        onCheckedChange={(marcada) =>
                          despachar(
                            cambiarSubtarea({
                              id: subtarea.id,
                              tareaId: tarea.id,
                              completada: marcada === true,
                            }),
                          )
                        }
                      />
                      <span
                        className={
                          subtarea.completada
                            ? 'flex-1 text-sm line-through text-muted-foreground'
                            : 'flex-1 text-sm'
                        }
                      >
                        {subtarea.titulo}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                        onClick={() =>
                          despachar(eliminarSubtareaTarea({ id: subtarea.id, tareaId: tarea.id }))
                        }
                      >
                        ✕
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={alAnadirSubtarea} className="flex gap-2">
                <Input
                  value={nuevaSubtarea}
                  onChange={(evento) => setNuevaSubtarea(evento.target.value)}
                  placeholder={intl.formatMessage({ id: 'tarea.detalle.nuevaSubtarea' })}
                />
                <Button type="submit" size="sm">
                  {intl.formatMessage({ id: 'tareas.anadir' })}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
