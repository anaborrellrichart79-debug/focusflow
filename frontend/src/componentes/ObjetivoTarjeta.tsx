import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { eliminarObjetivo } from '@/almacen/objetivosSlice';
import {
  alternarCompletadaTarea,
  crearTarea,
  eliminarTarea,
} from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { Objetivo } from '@/servicios/objetivos';

export function ObjetivoTarjeta({ objetivo }: { objetivo: Objetivo }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) =>
    estado.tareas.lista.filter((tarea) => tarea.objetivoId === objetivo.id),
  );
  const [tituloTarea, setTituloTarea] = useState('');

  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter((tarea) => tarea.completada).length;
  const progreso = totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);

  function alAnadirTarea(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloTarea.trim()) return;
    despachar(crearTarea({ titulo: tituloTarea, objetivoId: objetivo.id }));
    setTituloTarea('');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{objetivo.titulo}</CardTitle>
          {objetivo.descripcion && (
            <p className="mt-1 text-sm text-muted-foreground">{objetivo.descripcion}</p>
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
            <li key={tarea.id} className="flex items-center gap-2">
              <Checkbox
                checked={tarea.completada}
                onCheckedChange={(marcada) =>
                  despachar(
                    alternarCompletadaTarea({ id: tarea.id, completada: marcada === true }),
                  )
                }
              />
              <span
                className={
                  tarea.completada ? 'flex-1 text-sm line-through text-muted-foreground' : 'flex-1 text-sm'
                }
              >
                {tarea.titulo}
              </span>
              <Button
                variant="ghost"
                size="xs"
                aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                onClick={() => despachar(eliminarTarea(tarea.id))}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={alAnadirTarea} className="flex gap-2">
          <Input
            value={tituloTarea}
            onChange={(evento) => setTituloTarea(evento.target.value)}
            placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
          />
          <Button type="submit" size="sm">
            {intl.formatMessage({ id: 'tareas.anadir' })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
