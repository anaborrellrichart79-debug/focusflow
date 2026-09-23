import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarEtiquetaFiltro } from '@/almacen/interfazSlice';
import { cn } from '@/lib/utils';
import { aplanarArbol } from '@/utilidades/etiquetas';

// Filtro global por etiqueta, junto al de ámbito: se aplica a todas las vistas
// de tareas e incluye las subetiquetas. Sin etiquetas creadas no se muestra.
export function FiltroEtiqueta() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const etiquetas = usarSelector((estado) => estado.etiquetas.lista);
  const seleccionada = usarSelector((estado) => estado.interfaz.etiquetaFiltro ?? null);

  if (etiquetas.length === 0) return null;

  return (
    <label className="flex flex-col gap-1 px-1 text-xs text-muted-foreground">
      {intl.formatMessage({ id: 'etiquetas.filtro' })}
      <select
        value={seleccionada ?? ''}
        onChange={(evento) => despachar(cambiarEtiquetaFiltro(evento.target.value || null))}
        className={cn(
          'rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm',
          seleccionada && 'border-primary text-primary',
        )}
      >
        <option value="">{intl.formatMessage({ id: 'etiquetas.filtro.todas' })}</option>
        {aplanarArbol(etiquetas).map(({ etiqueta, nivel }) => (
          <option key={etiqueta.id} value={etiqueta.id}>
            {/* Sangría con espacios de ancho fijo: los <option> no admiten estilos. */}
            {'   '.repeat(nivel - 1)}
            {etiqueta.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
