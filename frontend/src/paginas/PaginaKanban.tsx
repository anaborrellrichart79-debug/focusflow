import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import {
  cambiarEstadoTarea,
  cargarTareas,
  crearTarea,
  eliminarTarea,
  marcarAltoImpactoTarea,
} from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { EstadoTarea } from '@/servicios/tareas';

const COLUMNAS: { estado: EstadoTarea; clave: string }[] = [
  { estado: 'POR_HACER', clave: 'kanban.columna.porHacer' },
  { estado: 'EN_PROCESO', clave: 'kanban.columna.enProceso' },
  { estado: 'HECHA', clave: 'kanban.columna.hecha' },
];

export function PaginaKanban() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const objetivos = usarSelector((estado) => estado.objetivos.lista);
  const [tituloNuevaTarea, setTituloNuevaTarea] = useState('');

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarObjetivos());
  }, [despachar]);

  function alAnadirTarea(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloNuevaTarea.trim()) return;
    despachar(crearTarea({ titulo: tituloNuevaTarea }));
    setTituloNuevaTarea('');
  }

  function tituloObjetivo(objetivoId: string | null) {
    if (!objetivoId) return null;
    return objetivos.find((objetivo) => objetivo.id === objetivoId)?.titulo ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'kanban.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <form onSubmit={alAnadirTarea} className="flex gap-2">
        <Input
          value={tituloNuevaTarea}
          onChange={(evento) => setTituloNuevaTarea(evento.target.value)}
          placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
        />
        <Button type="submit" size="sm">
          {intl.formatMessage({ id: 'tareas.anadir' })}
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNAS.map((columna, indiceColumna) => (
          <Card key={columna.estado} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                {intl.formatMessage({ id: columna.clave })}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tareas
                .filter((tarea) => tarea.estado === columna.estado)
                .map((tarea) => {
                  const nombreObjetivo = tituloObjetivo(tarea.objetivoId);
                  return (
                    <div
                      key={tarea.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm">{tarea.titulo}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={intl.formatMessage({ id: 'pareto.marcar' })}
                          aria-pressed={tarea.esAltoImpacto}
                          onClick={() =>
                            despachar(
                              marcarAltoImpactoTarea({
                                id: tarea.id,
                                esAltoImpacto: !tarea.esAltoImpacto,
                              }),
                            )
                          }
                        >
                          {tarea.esAltoImpacto ? '★' : '☆'}
                        </Button>
                      </div>
                      {nombreObjetivo && (
                        <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {nombreObjetivo}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={intl.formatMessage({ id: 'kanban.mover.anterior' })}
                            disabled={indiceColumna === 0}
                            onClick={() =>
                              despachar(
                                cambiarEstadoTarea({
                                  id: tarea.id,
                                  estado: COLUMNAS[indiceColumna - 1].estado,
                                }),
                              )
                            }
                          >
                            ←
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={intl.formatMessage({ id: 'kanban.mover.siguiente' })}
                            disabled={indiceColumna === COLUMNAS.length - 1}
                            onClick={() =>
                              despachar(
                                cambiarEstadoTarea({
                                  id: tarea.id,
                                  estado: COLUMNAS[indiceColumna + 1].estado,
                                }),
                              )
                            }
                          >
                            →
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
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
