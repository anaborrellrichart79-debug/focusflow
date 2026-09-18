import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarPrioridadTarea, cargarTareas, eliminarTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tarea } from '@/servicios/tareas';

const CUADRANTES: {
  urgente: boolean;
  importante: boolean;
  clave: string;
}[] = [
  { urgente: true, importante: true, clave: 'eisenhower.cuadrante.hacer' },
  { urgente: false, importante: true, clave: 'eisenhower.cuadrante.planificar' },
  { urgente: true, importante: false, clave: 'eisenhower.cuadrante.delegar' },
  { urgente: false, importante: false, clave: 'eisenhower.cuadrante.eliminar' },
];

export function PaginaEisenhower() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);

  useEffect(() => {
    despachar(cargarTareas());
  }, [despachar]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'eisenhower.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CUADRANTES.map((cuadrante) => (
          <Card key={cuadrante.clave}>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                {intl.formatMessage({ id: cuadrante.clave })}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tareas
                .filter(
                  (tarea) =>
                    tarea.urgente === cuadrante.urgente &&
                    tarea.importante === cuadrante.importante,
                )
                .map((tarea) => (
                  <div
                    key={tarea.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3"
                  >
                    <span className="text-sm">{tarea.titulo}</span>
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
