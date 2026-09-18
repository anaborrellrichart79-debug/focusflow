import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import { cargarHistorialPomodoro } from '@/almacen/pomodoroSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { EstadoTarea } from '@/servicios/tareas';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const COLUMNAS_ESTADO: { estado: EstadoTarea; clave: string; color: string }[] = [
  { estado: 'POR_HACER', clave: 'kanban.columna.porHacer', color: 'var(--chart-1)' },
  { estado: 'EN_PROCESO', clave: 'kanban.columna.enProceso', color: 'var(--chart-2)' },
  { estado: 'HECHA', clave: 'kanban.columna.hecha', color: 'var(--chart-3)' },
];

export function PaginaEstadisticas() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const objetivos = usarSelector((estado) => estado.objetivos.lista);
  const historialPomodoro = usarSelector((estado) => estado.pomodoro.historial);

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarObjetivos());
    despachar(cargarHistorialPomodoro());
  }, [despachar]);

  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter((tarea) => tarea.estado === 'HECHA').length;
  const porcentajeCompletado =
    totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);

  const tareasAltoImpacto = tareas.filter((tarea) => tarea.esAltoImpacto);
  const porcentajeAltoImpacto =
    totalTareas === 0 ? 0 : Math.round((tareasAltoImpacto.length / totalTareas) * 100);

  const { inicioHoy, inicioSemana } = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return { inicioHoy: hoy, inicioSemana: new Date(Date.now() - 7 * MILISEGUNDOS_POR_DIA) };
  }, []);

  const sesionesTrabajo = historialPomodoro.filter((sesion) => sesion.fase === 'TRABAJO');
  const sesionesTrabajoSemana = sesionesTrabajo.filter(
    (sesion) => new Date(sesion.completadaEn) >= inicioSemana,
  );
  const pomodorosHoy = sesionesTrabajo.filter(
    (sesion) => new Date(sesion.completadaEn) >= inicioHoy,
  ).length;
  const pomodorosSemana = sesionesTrabajoSemana.length;
  const minutosTrabajoSemana = Math.round(
    sesionesTrabajoSemana.reduce((total, sesion) => total + sesion.duracionSegundos, 0) / 60,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'estadisticas.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.progresoGlobal' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">
            {porcentajeCompletado}%
          </span>
          <span className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'objetivos.progreso' },
              { completadas: tareasCompletadas, total: totalTareas },
            )}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.pomodoro.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {sesionesTrabajo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'estadisticas.pomodoro.vacio' })}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">
                  {pomodorosHoy}
                </span>
                <span className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'estadisticas.pomodoro.hoy' })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">
                  {pomodorosSemana}
                </span>
                <span className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'estadisticas.pomodoro.semana' })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">
                  {minutosTrabajoSemana}
                </span>
                <span className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'estadisticas.pomodoro.minutosSemana' })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.distribucion.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-6 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
            {COLUMNAS_ESTADO.map((columna) => {
              const cantidad = tareas.filter((tarea) => tarea.estado === columna.estado).length;
              if (cantidad === 0) return null;
              return (
                <div
                  key={columna.estado}
                  style={{
                    backgroundColor: columna.color,
                    flexGrow: cantidad,
                  }}
                  className="flex-shrink-0 first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {COLUMNAS_ESTADO.map((columna) => {
              const cantidad = tareas.filter((tarea) => tarea.estado === columna.estado).length;
              return (
                <div key={columna.estado} className="flex items-center gap-1.5 text-sm">
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: columna.color }}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    {intl.formatMessage({ id: columna.clave })}
                  </span>
                  <span className="font-medium tabular-nums">{cantidad}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.objetivos.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {objetivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'objetivos.vacio' })}
            </p>
          ) : (
            objetivos.map((objetivo) => {
              const tareasObjetivo = tareas.filter((tarea) => tarea.objetivoId === objetivo.id);
              const completadasObjetivo = tareasObjetivo.filter(
                (tarea) => tarea.estado === 'HECHA',
              ).length;
              const progreso =
                tareasObjetivo.length === 0
                  ? 0
                  : Math.round((completadasObjetivo / tareasObjetivo.length) * 100);
              return (
                <div key={objetivo.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{objetivo.titulo}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {intl.formatMessage(
                        { id: 'objetivos.progreso' },
                        { completadas: completadasObjetivo, total: tareasObjetivo.length },
                      )}
                    </span>
                  </div>
                  <Progress value={progreso} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.pareto.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-6 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
            {tareasAltoImpacto.length > 0 && (
              <div
                style={{ backgroundColor: 'var(--chart-1)', flexGrow: tareasAltoImpacto.length }}
                className="flex-shrink-0 first:rounded-l-full last:rounded-r-full"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} aria-hidden />
              <span className="text-muted-foreground">
                {intl.formatMessage({ id: 'estadisticas.pareto.leyendaAltoImpacto' })}
              </span>
              <span className="font-medium tabular-nums">{tareasAltoImpacto.length}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'estadisticas.pareto.descripcion' },
              { marcadas: tareasAltoImpacto.length, total: totalTareas, porcentaje: porcentajeAltoImpacto },
            )}
          </p>
          {tareasAltoImpacto.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'estadisticas.pareto.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {tareasAltoImpacto.map((tarea) => (
                <li key={tarea.id} className="text-sm">
                  ★ {tarea.titulo}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
