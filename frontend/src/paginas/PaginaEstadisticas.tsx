import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  seleccionarHistorialPomodoroDelAmbito,
  seleccionarObjetivosDelAmbito,
  seleccionarTareasDelAmbito,
} from '@/almacen/selectores';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import { cargarHistorialPomodoro } from '@/almacen/pomodoroSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapaActividad } from '@/componentes/MapaActividad';
import type { EstadoTarea } from '@/servicios/tareas';
import { calcularRachaDias } from '@/utilidades/rachas';
import { construirFilaCsv, descargarCsv } from '@/utilidades/exportar';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const COLUMNAS_ESTADO: { estado: EstadoTarea; clave: string; color: string }[] = [
  { estado: 'POR_HACER', clave: 'kanban.columna.porHacer', color: 'var(--chart-1)' },
  { estado: 'EN_PROCESO', clave: 'kanban.columna.enProceso', color: 'var(--chart-2)' },
  { estado: 'HECHA', clave: 'kanban.columna.hecha', color: 'var(--chart-3)' },
];

export function PaginaEstadisticas() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector(seleccionarTareasDelAmbito);
  const objetivos = usarSelector(seleccionarObjetivosDelAmbito);
  const historialPomodoro = usarSelector(seleccionarHistorialPomodoroDelAmbito);

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
  const rachaDias = calcularRachaDias(sesionesTrabajo.map((sesion) => sesion.completadaEn));

  function tiempoRealMinutos(tareaId: string) {
    return Math.round(
      historialPomodoro
        .filter((sesion) => sesion.fase === 'TRABAJO' && sesion.tareaId === tareaId)
        .reduce((total, sesion) => total + sesion.duracionSegundos, 0) / 60,
    );
  }

  const comparacionTiempo = tareas
    .filter((tarea) => tarea.tiempoEstimadoMinutos != null)
    .map((tarea) => ({ tarea, tiempoReal: tiempoRealMinutos(tarea.id) }));

  function alExportarCsv() {
    const filas = [
      construirFilaCsv([
        'Título',
        'Objetivo',
        'Estado',
        'Fecha límite',
        'Tiempo estimado (min)',
        'Tiempo real (min)',
        'Etiquetas',
      ]),
      ...tareas.map((tarea) => {
        const nombreObjetivo = objetivos.find((o) => o.id === tarea.objetivoId)?.titulo ?? '';
        return construirFilaCsv([
          tarea.titulo,
          nombreObjetivo,
          tarea.estado,
          tarea.fechaLimite ? intl.formatDate(tarea.fechaLimite) : '',
          tarea.tiempoEstimadoMinutos ?? '',
          tiempoRealMinutos(tarea.id),
          tarea.etiquetas.map((etiqueta) => etiqueta.nombre).join('; '),
        ]);
      }),
    ];
    descargarCsv(filas, `focusflow-tareas-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'estadisticas.titulo' })}
        </h1>
        <div className="no-imprimir flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={alExportarCsv}>
            {intl.formatMessage({ id: 'estadisticas.exportar.csv' })}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            {intl.formatMessage({ id: 'estadisticas.exportar.pdf' })}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.progresoGlobal' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-primary">
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
            <div className="flex flex-col gap-4">
              {rachaDias > 0 ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-motivador">
                  <span aria-hidden>🔥</span>
                  {intl.formatMessage({ id: 'estadisticas.racha' }, { racha: rachaDias })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: 'estadisticas.racha.vacia' })}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-3 xs:gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-motivador">
                    {pomodorosHoy}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {intl.formatMessage({ id: 'estadisticas.pomodoro.hoy' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-motivador">
                    {pomodorosSemana}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {intl.formatMessage({ id: 'estadisticas.pomodoro.semana' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-motivador">
                    {minutosTrabajoSemana}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {intl.formatMessage({ id: 'estadisticas.pomodoro.minutosSemana' })}
                  </span>
                </div>
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
                style={{ backgroundColor: 'var(--motivador)', flexGrow: tareasAltoImpacto.length }}
                className="flex-shrink-0 first:rounded-l-full last:rounded-r-full"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="size-3 rounded-sm" style={{ backgroundColor: 'var(--motivador)' }} aria-hidden />
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
                  <span className="text-motivador">★</span> {tarea.titulo}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.actividad.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <MapaActividad fechasIso={sesionesTrabajo.map((sesion) => sesion.completadaEn)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'estadisticas.tiempoComparado.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {comparacionTiempo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'estadisticas.tiempoComparado.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comparacionTiempo.map(({ tarea, tiempoReal }) => (
                <li key={tarea.id} className="flex flex-col gap-1">
                  <span className="text-sm">{tarea.titulo}</span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      {intl.formatMessage(
                        { id: 'estadisticas.tiempoComparado.estimado' },
                        { minutos: tarea.tiempoEstimadoMinutos },
                      )}
                    </span>
                    <span
                      className={
                        tiempoReal > (tarea.tiempoEstimadoMinutos ?? 0)
                          ? 'font-medium text-destructive'
                          : 'font-medium text-exito'
                      }
                    >
                      {intl.formatMessage(
                        { id: 'estadisticas.tiempoComparado.real' },
                        { minutos: tiempoReal },
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
