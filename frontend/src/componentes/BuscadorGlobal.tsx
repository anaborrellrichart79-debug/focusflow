import { FileText, ListTodo, Tag, Target } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { cargarEtiquetas } from '@/almacen/etiquetasSlice';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarEtiquetaFiltro } from '@/almacen/interfazSlice';
import { cargarNotas } from '@/almacen/notasSlice';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { buscar, extracto, LONGITUD_MINIMA_BUSQUEDA } from '@/utilidades/busqueda';
import { ESTADOS_TAREA } from '@/utilidades/estados';
import { DetalleTarea } from './DetalleTarea';

const CLASE_RESULTADO = 'flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted';

function Grupo({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="flex items-center gap-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icono}
        {titulo}
      </h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  );
}

// Búsqueda en todo lo del usuario (tareas con sus subtareas, objetivos, notas
// y etiquetas), sobre lo que ya tiene cargado la tienda: es instantánea y no
// distingue tildes ni mayúsculas. Ignora a propósito los filtros globales de
// ámbito y etiqueta: si se busca algo, se quiere encontrar esté donde esté.
export function BuscadorGlobal({
  abierto,
  alCambiarAbierto,
}: {
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const navegar = useNavigate();
  const [consulta, setConsulta] = useState('');
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const objetivos = usarSelector((estado) => estado.objetivos.lista);
  const notas = usarSelector((estado) => estado.notas.lista);
  const etiquetas = usarSelector((estado) => estado.etiquetas.lista);

  useEffect(() => {
    if (!abierto) return;
    despachar(cargarTareas());
    despachar(cargarObjetivos());
    despachar(cargarNotas());
    despachar(cargarEtiquetas());
  }, [abierto, despachar]);

  const resultados = useMemo(
    () => buscar(consulta, { tareas, objetivos, notas, etiquetas }),
    [consulta, tareas, objetivos, notas, etiquetas],
  );
  const suficiente = consulta.trim().length >= LONGITUD_MINIMA_BUSQUEDA;

  function cambiarAbierto(nuevo: boolean) {
    if (!nuevo) setConsulta('');
    alCambiarAbierto(nuevo);
  }

  function ir(ruta: string) {
    cambiarAbierto(false);
    navegar(ruta);
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogContent className="top-[10vh] max-h-[80vh] translate-y-0 gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{intl.formatMessage({ id: 'busqueda.titulo' })}</DialogTitle>
        </DialogHeader>
        <Input
          type="search"
          autoFocus
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          placeholder={intl.formatMessage({ id: 'busqueda.placeholder' })}
          aria-label={intl.formatMessage({ id: 'busqueda.titulo' })}
        />

        <div aria-live="polite" className="flex flex-col gap-4">
          {!suficiente ? (
            <p className="px-2 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'busqueda.minimo' })}
            </p>
          ) : resultados.total === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'busqueda.sinResultados' }, { consulta: consulta.trim() })}
            </p>
          ) : (
            <>
              {resultados.tareas.length > 0 && (
                <Grupo
                  titulo={intl.formatMessage({ id: 'busqueda.grupo.tareas' })}
                  icono={<ListTodo aria-hidden className="size-3.5" />}
                >
                  {resultados.tareas.map(({ tarea, subtarea, descripcion }) => {
                    const columna = ESTADOS_TAREA.find((c) => c.estado === tarea.estado);
                    return (
                      <li key={tarea.id} className="flex flex-col rounded-md px-2 py-1.5 hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <DetalleTarea tarea={tarea} className="flex-1 text-left text-sm font-medium hover:underline" />
                          {columna && (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <span aria-hidden className="size-2 rounded-full" style={{ background: columna.color }} />
                              {intl.formatMessage({ id: columna.clave })}
                            </span>
                          )}
                        </div>
                        {subtarea && (
                          <span className="text-xs text-muted-foreground">
                            {intl.formatMessage({ id: 'busqueda.enSubtarea' }, { titulo: subtarea })}
                          </span>
                        )}
                        {descripcion && <span className="text-xs text-muted-foreground">{descripcion}</span>}
                      </li>
                    );
                  })}
                </Grupo>
              )}

              {resultados.objetivos.length > 0 && (
                <Grupo
                  titulo={intl.formatMessage({ id: 'busqueda.grupo.objetivos' })}
                  icono={<Target aria-hidden className="size-3.5" />}
                >
                  {resultados.objetivos.map((objetivo) => (
                    <li key={objetivo.id}>
                      <button type="button" className={CLASE_RESULTADO} onClick={() => ir('/objetivos')}>
                        <span className="font-medium">{objetivo.titulo}</span>
                        {objetivo.descripcion && (
                          <span className="text-xs text-muted-foreground">
                            {extracto(objetivo.descripcion, consulta)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </Grupo>
              )}

              {resultados.notas.length > 0 && (
                <Grupo
                  titulo={intl.formatMessage({ id: 'busqueda.grupo.notas' })}
                  icono={<FileText aria-hidden className="size-3.5" />}
                >
                  {resultados.notas.map((nota) => (
                    <li key={nota.id}>
                      <button
                        type="button"
                        className={CLASE_RESULTADO}
                        onClick={() => ir(nota.tipo === 'TODO' ? '/notas?pestana=todo' : '/notas')}
                      >
                        <span>{extracto(nota.contenido, consulta)}</span>
                        <span className="text-xs text-muted-foreground">
                          {intl.formatMessage({ id: nota.tipo === 'TODO' ? 'busqueda.tipo.todo' : 'busqueda.tipo.nota' })}
                          {nota.tarea && ` · ${nota.tarea.titulo}`}
                          {nota.objetivo && ` · ${nota.objetivo.titulo}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </Grupo>
              )}

              {resultados.etiquetas.length > 0 && (
                <Grupo
                  titulo={intl.formatMessage({ id: 'busqueda.grupo.etiquetas' })}
                  icono={<Tag aria-hidden className="size-3.5" />}
                >
                  {resultados.etiquetas.map(({ etiqueta, ruta }) => (
                    <li key={etiqueta.id}>
                      <button
                        type="button"
                        className={CLASE_RESULTADO}
                        onClick={() => {
                          despachar(cambiarEtiquetaFiltro(etiqueta.id));
                          ir('/kanban');
                        }}
                      >
                        <span className="font-medium">{ruta}</span>
                        <span className="text-xs text-muted-foreground">
                          {intl.formatMessage({ id: 'busqueda.verEtiqueta' })}
                        </span>
                      </button>
                    </li>
                  ))}
                </Grupo>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
