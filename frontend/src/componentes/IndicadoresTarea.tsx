import { Badge } from '@/components/ui/badge';
import type { Tarea } from '@/servicios/tareas';

export function IndicadoresTarea({ tarea }: { tarea: Tarea }) {
  if (tarea.etiquetas.length === 0 && tarea.subtareas.length === 0) return null;

  const completadas = tarea.subtareas.filter((subtarea) => subtarea.completada).length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tarea.etiquetas.map((etiqueta) => (
        <Badge key={etiqueta.id} variant="outline">
          {etiqueta.nombre}
        </Badge>
      ))}
      {tarea.subtareas.length > 0 && (
        <span className="text-xs text-muted-foreground">
          ☑ {completadas}/{tarea.subtareas.length}
        </span>
      )}
    </div>
  );
}
