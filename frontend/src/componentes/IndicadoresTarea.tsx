import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tarea } from '@/servicios/tareas';
import { rutaEtiqueta } from '@/utilidades/etiquetas';
import { InsigniaAsignatura } from './InsigniaAsignatura';
import { InsigniaTipoEscolar } from './InsigniaTipoEscolar';

// Aprobada en verde, devuelta en rojo, pendiente en neutro: siempre con texto,
// nunca solo el color.
const CLASE_REVISION = {
  PENDIENTE: 'border-border text-muted-foreground',
  APROBADA: 'border-exito/40 text-exito',
  DEVUELTA: 'border-destructive/40 text-destructive',
};

export function IndicadoresTarea({ tarea }: { tarea: Tarea }) {
  const intl = useIntl();
  // Para enseñar la ruta completa (Matemáticas › Cálculo) al pasar el ratón.
  const todasLasEtiquetas = usarSelector((estado) => estado.etiquetas.lista);
  if (
    !tarea.estadoRevision &&
    !tarea.creadaPor &&
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
      {tarea.estadoRevision && (
        <Badge variant="outline" className={cn(CLASE_REVISION[tarea.estadoRevision])}>
          {intl.formatMessage({ id: `revision.insignia.${tarea.estadoRevision}` })}
        </Badge>
      )}
      {tarea.creadaPor && (
        <span className="text-xs text-muted-foreground">
          {intl.formatMessage(
            { id: 'revision.asignadaPor' },
            { nombre: tarea.creadaPor.nombre ?? tarea.creadaPor.correo },
          )}
        </span>
      )}
      {tarea.tipoEscolar && <InsigniaTipoEscolar tipo={tarea.tipoEscolar} />}
      {tarea.asignaturaHorario && (
        <InsigniaAsignatura
          nombre={tarea.asignaturaHorario.asignatura.nombre}
          color={tarea.asignaturaHorario.color}
        />
      )}
      {tarea.etiquetas.map((etiqueta) => (
        <Badge key={etiqueta.id} variant="outline" title={rutaEtiqueta(todasLasEtiquetas, etiqueta.id)}>
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
