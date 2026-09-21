import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { diasHastaFecha } from '@/utilidades/fechas';

const DIAS_REVISION = 7;

export function PaginaRevision() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const objetivos = usarSelector((estado) => estado.objetivos.lista);

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarObjetivos());
  }, [despachar]);

  const tareasCompletadasSemana = useMemo(
    () =>
      tareas
        .filter(
          (tarea) => tarea.estado === 'HECHA' && diasHastaFecha(tarea.actualizadoEn) >= -DIAS_REVISION,
        )
        .sort((a, b) => diasHastaFecha(b.actualizadoEn) - diasHastaFecha(a.actualizadoEn)),
    [tareas],
  );

  const objetivosSinTocar = useMemo(
    () =>
      objetivos
        .filter((objetivo) => {
          const tareasObjetivo = tareas.filter((tarea) => tarea.objetivoId === objetivo.id);
          const sinCompletar = tareasObjetivo.some((tarea) => tarea.estado !== 'HECHA');
          const inactivo = diasHastaFecha(objetivo.actualizadoEn) < -DIAS_REVISION;
          return inactivo && (tareasObjetivo.length === 0 || sinCompletar);
        })
        .sort((a, b) => diasHastaFecha(a.actualizadoEn) - diasHastaFecha(b.actualizadoEn)),
    [objetivos, tareas],
  );

  const tareasSueltasPendientes = useMemo(
    () => tareas.filter((tarea) => tarea.objetivoId === null && tarea.estado !== 'HECHA'),
    [tareas],
  );

  const tareasVencidas = useMemo(
    () =>
      tareas
        .filter(
          (tarea) =>
            tarea.estado !== 'HECHA' && tarea.fechaLimite && diasHastaFecha(tarea.fechaLimite) < 0,
        )
        .sort((a, b) => diasHastaFecha(a.fechaLimite!) - diasHastaFecha(b.fechaLimite!)),
    [tareas],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'revision.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {intl.formatMessage({ id: 'revision.eslogan' })}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-motivador">
            🔥 {intl.formatMessage({ id: 'revision.vencidas.titulo' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tareasVencidas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'revision.vencidas.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tareasVencidas.map((tarea) => (
                <li key={tarea.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{tarea.titulo}</span>
                  <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite!} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-exito">
            ✅ {intl.formatMessage({ id: 'revision.completadas.titulo' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tareasCompletadasSemana.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'revision.completadas.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tareasCompletadasSemana.map((tarea) => (
                <li key={tarea.id} className="text-sm line-through text-muted-foreground">
                  {tarea.titulo}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'revision.objetivosSinTocar.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {objetivosSinTocar.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'revision.objetivosSinTocar.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {objetivosSinTocar.map((objetivo) => (
                <li key={objetivo.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{objetivo.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {intl.formatMessage(
                      { id: 'revision.objetivosSinTocar.diasInactivo' },
                      { dias: -diasHastaFecha(objetivo.actualizadoEn) },
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'revision.sueltas.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tareasSueltasPendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'revision.sueltas.vacio' })}
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-1.5">
                {tareasSueltasPendientes.map((tarea) => (
                  <li key={tarea.id} className="text-sm">
                    {tarea.titulo}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link to="/objetivos">{intl.formatMessage({ id: 'revision.sueltas.organizar' })}</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
