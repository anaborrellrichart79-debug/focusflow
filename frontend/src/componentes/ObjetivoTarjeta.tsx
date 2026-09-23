import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { eliminarObjetivo } from '@/almacen/objetivosSlice';
import { cambiarEstadoTarea, crearTarea, eliminarTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { Objetivo } from '@/servicios/objetivos';
import { DetalleTarea } from './DetalleTarea';
import { EtiquetaFechaLimite } from './EtiquetaFechaLimite';
import { IndicadoresTarea } from './IndicadoresTarea';

export function ObjetivoTarjeta({ objetivo }: { objetivo: Objetivo }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) =>
    estado.tareas.lista.filter(
      (tarea) => tarea.objetivoId === objetivo.id && tarea.estado !== 'ARCHIVADA',
    ),
  );
  const [tituloTarea, setTituloTarea] = useState('');
  const [fechaLimiteTarea, setFechaLimiteTarea] = useState('');

  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter((tarea) => tarea.estado === 'HECHA').length;
  const progreso = totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);

  function alAnadirTarea(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloTarea.trim()) return;
    despachar(
      crearTarea({
        titulo: tituloTarea,
        objetivoId: objetivo.id,
        ambito: objetivo.ambito,
        fechaLimite: fechaLimiteTarea || undefined,
      }),
    );
    setTituloTarea('');
    setFechaLimiteTarea('');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{objetivo.titulo}</CardTitle>
          {objetivo.descripcion && (
            <p className="mt-1 text-sm text-muted-foreground">{objetivo.descripcion}</p>
          )}
          {objetivo.fechaLimite && (
            <div className="mt-1.5">
              <EtiquetaFechaLimite fechaLimite={objetivo.fechaLimite} />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label={intl.formatMessage({ id: 'objetivos.eliminar' })}
          onClick={() => despachar(eliminarObjetivo(objetivo.id))}
        >
          ✕
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Progress value={progreso} />
          <span className="text-xs text-muted-foreground">
            {intl.formatMessage(
              { id: 'objetivos.progreso' },
              { completadas: tareasCompletadas, total: totalTareas },
            )}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {tareas.map((tarea) => (
            <li key={tarea.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={tarea.estado === 'HECHA'}
                  aria-label={intl.formatMessage(
                    { id: 'tareas.marcarCompletada' },
                    { titulo: tarea.titulo },
                  )}
                  onCheckedChange={(marcada) =>
                    despachar(
                      cambiarEstadoTarea({
                        id: tarea.id,
                        estado: marcada === true ? 'HECHA' : 'POR_HACER',
                      }),
                    )
                  }
                />
                <DetalleTarea
                  tarea={tarea}
                  className={
                    tarea.estado === 'HECHA'
                      ? 'flex-1 text-left text-sm line-through text-muted-foreground hover:no-underline'
                      : 'flex-1 text-left text-sm hover:underline'
                  }
                />
                {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                  onClick={() => despachar(eliminarTarea(tarea.id))}
                >
                  ✕
                </Button>
              </div>
              <IndicadoresTarea tarea={tarea} />
            </li>
          ))}
        </ul>

        <form onSubmit={alAnadirTarea} className="flex flex-wrap gap-2">
          <Input
            value={tituloTarea}
            onChange={(evento) => setTituloTarea(evento.target.value)}
            placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
            className="min-w-32 flex-1"
          />
          <Input
            type="date"
            value={fechaLimiteTarea}
            onChange={(evento) => setFechaLimiteTarea(evento.target.value)}
            aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
            className="w-auto"
          />
          <Button type="submit" size="sm">
            {intl.formatMessage({ id: 'tareas.anadir' })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
