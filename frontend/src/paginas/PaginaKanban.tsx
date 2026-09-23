import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { seleccionarObjetivosDelAmbito, seleccionarTareasDelAmbito } from '@/almacen/selectores';
import { cargarEtiquetas } from '@/almacen/etiquetasSlice';
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
import { DetalleTarea } from '@/componentes/DetalleTarea';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { IndicadoresTarea } from '@/componentes/IndicadoresTarea';
import type { EstadoTarea } from '@/servicios/tareas';

const COLUMNAS: { estado: EstadoTarea; clave: string; color: string }[] = [
  { estado: 'POR_HACER', clave: 'kanban.columna.porHacer', color: 'var(--chart-1)' },
  { estado: 'EN_PROCESO', clave: 'kanban.columna.enProceso', color: 'var(--chart-2)' },
  { estado: 'HECHA', clave: 'kanban.columna.hecha', color: 'var(--chart-3)' },
];

export function PaginaKanban() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector(seleccionarTareasDelAmbito);
  const objetivos = usarSelector(seleccionarObjetivosDelAmbito);
  const [tituloNuevaTarea, setTituloNuevaTarea] = useState('');
  const [fechaLimiteNuevaTarea, setFechaLimiteNuevaTarea] = useState('');
  const [idTareaArrastrando, setIdTareaArrastrando] = useState<string | null>(null);
  const [columnaSobrevolada, setColumnaSobrevolada] = useState<EstadoTarea | null>(null);

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarObjetivos());
    despachar(cargarEtiquetas());
  }, [despachar]);

  function alAnadirTarea(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloNuevaTarea.trim()) return;
    despachar(
      crearTarea({ titulo: tituloNuevaTarea, fechaLimite: fechaLimiteNuevaTarea || undefined }),
    );
    setTituloNuevaTarea('');
    setFechaLimiteNuevaTarea('');
  }

  function tituloObjetivo(objetivoId: string | null) {
    if (!objetivoId) return null;
    return objetivos.find((objetivo) => objetivo.id === objetivoId)?.titulo ?? null;
  }

  function alSoltarTarea(estadoDestino: EstadoTarea) {
    setColumnaSobrevolada(null);
    if (!idTareaArrastrando) return;
    const tarea = tareas.find((tarea) => tarea.id === idTareaArrastrando);
    setIdTareaArrastrando(null);
    if (!tarea || tarea.estado === estadoDestino) return;
    despachar(cambiarEstadoTarea({ id: tarea.id, estado: estadoDestino }));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'kanban.titulo' })}
        </h1>
      </div>

      <form onSubmit={alAnadirTarea} className="flex flex-wrap gap-2">
        <Input
          value={tituloNuevaTarea}
          onChange={(evento) => setTituloNuevaTarea(evento.target.value)}
          placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
          className="min-w-32 flex-1"
        />
        <Input
          type="date"
          value={fechaLimiteNuevaTarea}
          onChange={(evento) => setFechaLimiteNuevaTarea(evento.target.value)}
          aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
          className="w-auto"
        />
        <Button type="submit" size="sm">
          {intl.formatMessage({ id: 'tareas.anadir' })}
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        {COLUMNAS.map((columna, indiceColumna) => (
          <Card key={columna.estado} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: columna.color }}
                />
                {intl.formatMessage({ id: columna.clave })}
              </CardTitle>
            </CardHeader>
            <CardContent
              className="flex flex-col gap-2 rounded-lg transition-colors"
              style={{
                backgroundColor:
                  columnaSobrevolada === columna.estado
                    ? `color-mix(in oklch, ${columna.color} 15%, transparent)`
                    : undefined,
              }}
              onDragOver={(evento) => {
                evento.preventDefault();
                setColumnaSobrevolada(columna.estado);
              }}
              onDragLeave={() =>
                setColumnaSobrevolada((actual) => (actual === columna.estado ? null : actual))
              }
              onDrop={(evento) => {
                evento.preventDefault();
                alSoltarTarea(columna.estado);
              }}
            >
              {tareas
                .filter((tarea) => tarea.estado === columna.estado)
                .map((tarea) => {
                  const nombreObjetivo = tituloObjetivo(tarea.objetivoId);
                  return (
                    <div
                      key={tarea.id}
                      draggable
                      onDragStart={() => setIdTareaArrastrando(tarea.id)}
                      onDragEnd={() => {
                        setIdTareaArrastrando(null);
                        setColumnaSobrevolada(null);
                      }}
                      className={`flex cursor-grab flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                        idTareaArrastrando === tarea.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <DetalleTarea tarea={tarea} className="text-left text-sm hover:underline" />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={intl.formatMessage({ id: 'pareto.marcar' })}
                          aria-pressed={tarea.esAltoImpacto}
                          className={
                            tarea.esAltoImpacto
                              ? 'text-motivador hover:text-motivador'
                              : undefined
                          }
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
                      {(nombreObjetivo || tarea.fechaLimite) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {nombreObjetivo && (
                            <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {nombreObjetivo}
                            </span>
                          )}
                          {tarea.fechaLimite && (
                            <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />
                          )}
                        </div>
                      )}
                      <IndicadoresTarea tarea={tarea} />
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
