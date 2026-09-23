import { Badge } from '@/components/ui/badge';
import type { Tarea } from '@/servicios/tareas';
import { InsigniaAsignatura } from './InsigniaAsignatura';
import { InsigniaTipoEscolar } from './InsigniaTipoEscolar';

export function IndicadoresTarea({ tarea }: { tarea: Tarea }) {
  if (
    !tarea.tipoEscolar &&
    !tarea.asignaturaHorario &&
    tarea.etiquetas.length === 0 &&
    tarea.subtareas.length === 0
  ) {
    return null;
  }

  const completadas = tarea.subtareas.filter((subtarea) => subtarea.completada).length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tarea.tipoEscolar && <InsigniaTipoEscolar tipo={tarea.tipoEscolar} />}
      {tarea.asignaturaHorario && (
        <InsigniaAsignatura
          nombre={tarea.asignaturaHorario.asignatura.nombre}
          color={tarea.asignaturaHorario.color}
        />
      )}
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
