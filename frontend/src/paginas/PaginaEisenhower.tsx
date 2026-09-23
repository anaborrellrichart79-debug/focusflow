import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { seleccionarTareasDelAmbito } from '@/almacen/selectores';
import { cargarEtiquetas } from '@/almacen/etiquetasSlice';
import { cambiarPrioridadTarea, cargarTareas, eliminarTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetalleTarea } from '@/componentes/DetalleTarea';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { IndicadoresTarea } from '@/componentes/IndicadoresTarea';
import type { Tarea } from '@/servicios/tareas';
import { esUrgentePorFecha } from '@/utilidades/fechas';

const CUADRANTES: {
  urgente: boolean;
  importante: boolean;
  clave: string;
  color: string;
}[] = [
  { urgente: true, importante: true, clave: 'eisenhower.cuadrante.hacer', color: 'var(--destructive)' },
  { urgente: false, importante: true, clave: 'eisenhower.cuadrante.planificar', color: 'var(--chart-1)' },
  { urgente: true, importante: false, clave: 'eisenhower.cuadrante.delegar', color: 'var(--motivador)' },
  { urgente: false, importante: false, clave: 'eisenhower.cuadrante.eliminar', color: 'var(--muted-foreground)' },
];

export function PaginaEisenhower() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector(seleccionarTareasDelAmbito);

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarEtiquetas());
  }, [despachar]);

  function urgenteEfectivo(tarea: Tarea) {
    return tarea.urgente || esUrgentePorFecha(tarea.fechaLimite);
  }

  function alternar(tarea: Tarea, campo: 'urgente' | 'importante') {
    despachar(
      cambiarPrioridadTarea({
        id: tarea.id,
        urgente: campo === 'urgente' ? !tarea.urgente : tarea.urgente,
        importante: campo === 'importante' ? !tarea.importante : tarea.importante,
      }),
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'eisenhower.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        {CUADRANTES.map((cuadrante) => (
          <Card key={cuadrante.clave}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: cuadrante.color }}
                />
                {intl.formatMessage({ id: cuadrante.clave })}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tareas
                .filter(
                  (tarea) =>
                    urgenteEfectivo(tarea) === cuadrante.urgente &&
                    tarea.importante === cuadrante.importante,
                )
                .map((tarea) => (
                  <div
                    key={tarea.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <DetalleTarea tarea={tarea} />
                    {(tarea.fechaLimite || (!tarea.urgente && urgenteEfectivo(tarea))) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tarea.fechaLimite && (
                          <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />
                        )}
                        {!tarea.urgente && urgenteEfectivo(tarea) && (
                          <span className="w-fit rounded-full border border-destructive/40 px-2 py-0.5 text-xs font-medium text-destructive">
                            ⏰ {intl.formatMessage({ id: 'eisenhower.autoUrgente' })}
                          </span>
                        )}
                      </div>
                    )}
                    <IndicadoresTarea tarea={tarea} />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <Button
                          variant={tarea.urgente ? 'default' : 'outline'}
                          size="xs"
                          aria-pressed={tarea.urgente}
                          onClick={() => alternar(tarea, 'urgente')}
                        >
                          {intl.formatMessage({ id: 'eisenhower.marcar.urgente' })}
                        </Button>
                        <Button
                          variant={tarea.importante ? 'default' : 'outline'}
                          size="xs"
                          aria-pressed={tarea.importante}
                          onClick={() => alternar(tarea, 'importante')}
                        >
                          {intl.formatMessage({ id: 'eisenhower.marcar.importante' })}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                        onClick={() => despachar(eliminarTarea(tarea.id))}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
