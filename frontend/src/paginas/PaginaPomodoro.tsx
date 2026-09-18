import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  CICLOS_PARA_DESCANSO_LARGO,
  cargarHistorialPomodoro,
  iniciar,
  notificacionMostrada,
  pausar,
  registrarSesionCompletada,
  reiniciarFase,
  tick,
} from '@/almacen/pomodoroSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reproducirAvisoFasePomodoro } from '@/utilidades/sonido';

const ETIQUETAS_FASE: Record<string, string> = {
  trabajo: 'pomodoro.fase.trabajo',
  descansoCorto: 'pomodoro.fase.descansoCorto',
  descansoLargo: 'pomodoro.fase.descansoLargo',
};

const ETIQUETAS_FASE_API: Record<string, string> = {
  TRABAJO: 'pomodoro.fase.trabajo',
  DESCANSO_CORTO: 'pomodoro.fase.descansoCorto',
  DESCANSO_LARGO: 'pomodoro.fase.descansoLargo',
};

function formatearTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos.toString().padStart(2, '0')}:${resto.toString().padStart(2, '0')}`;
}

export function PaginaPomodoro() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const {
    fase,
    segundosRestantes,
    activo,
    ciclosCompletados,
    notificacionPendiente,
    ultimaFaseCompletada,
    historial,
  } = usarSelector((estado) => estado.pomodoro);
  const tareas = usarSelector((estado) =>
    estado.tareas.lista.filter((tarea) => tarea.estado !== 'HECHA'),
  );
  const [tareaAsociadaId, setTareaAsociadaId] = useState('');

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarHistorialPomodoro());
  }, [despachar]);

  useEffect(() => {
    if (!activo) return;
    const identificador = setInterval(() => despachar(tick()), 1000);
    return () => clearInterval(identificador);
  }, [activo, despachar]);

  useEffect(() => {
    if (!notificacionPendiente) return;
    reproducirAvisoFasePomodoro();
    if (ultimaFaseCompletada) {
      despachar(
        registrarSesionCompletada({
          ...ultimaFaseCompletada,
          tareaId:
            ultimaFaseCompletada.fase === 'trabajo' && tareaAsociadaId
              ? tareaAsociadaId
              : undefined,
        }),
      );
    }
    despachar(notificacionMostrada());
  }, [notificacionPendiente, ultimaFaseCompletada, tareaAsociadaId, despachar]);

  const cicloActual = (ciclosCompletados % CICLOS_PARA_DESCANSO_LARGO) + 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {intl.formatMessage({ id: ETIQUETAS_FASE[fase] })}
          </span>
          <span className="text-6xl font-semibold tabular-nums tracking-tight">
            {formatearTiempo(segundosRestantes)}
          </span>
          <span className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'pomodoro.ciclo' },
              { actual: cicloActual, total: CICLOS_PARA_DESCANSO_LARGO },
            )}
          </span>

          <div className="mt-4 flex gap-3">
            {activo ? (
              <Button onClick={() => despachar(pausar())}>
                {intl.formatMessage({ id: 'pomodoro.pausar' })}
              </Button>
            ) : (
              <Button onClick={() => despachar(iniciar())}>
                {intl.formatMessage({ id: 'pomodoro.iniciar' })}
              </Button>
            )}
            <Button variant="outline" onClick={() => despachar(reiniciarFase())}>
              {intl.formatMessage({ id: 'pomodoro.reiniciar' })}
            </Button>
          </div>

          <label className="mt-2 flex w-full flex-col gap-1.5 text-left text-sm">
            {intl.formatMessage({ id: 'pomodoro.tareaAsociada.etiqueta' })}
            <select
              value={tareaAsociadaId}
              onChange={(evento) => setTareaAsociadaId(evento.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="">
                {intl.formatMessage({ id: 'pomodoro.tareaAsociada.ninguna' })}
              </option>
              {tareas.map((tarea) => (
                <option key={tarea.id} value={tarea.id}>
                  {tarea.titulo}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'pomodoro.historial.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'pomodoro.historial.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {historial.map((sesion) => (
                <li
                  key={sesion.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {intl.formatMessage({ id: ETIQUETAS_FASE_API[sesion.fase] })}
                    {sesion.tarea ? ` · ${sesion.tarea.titulo}` : ''}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {intl.formatMessage(
                      { id: 'pomodoro.historial.minutos' },
                      { minutos: Math.round(sesion.duracionSegundos / 60) },
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
