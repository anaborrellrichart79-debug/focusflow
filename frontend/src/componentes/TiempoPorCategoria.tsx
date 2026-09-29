import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { seleccionarHistorialPomodoroDelAmbito } from '@/almacen/selectores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CLAVE_SIN_TAREA,
  inicioPeriodo,
  tiempoPorCategoria,
  type AgrupacionTiempo,
  type PeriodoTiempo,
} from '@/utilidades/tiempoPorCategoria';

const PERIODOS: { valor: PeriodoTiempo; clave: string }[] = [
  { valor: 'SEMANA', clave: 'estadisticas.porCategoria.semana' },
  { valor: 'MES', clave: 'estadisticas.porCategoria.mes' },
  { valor: 'SIEMPRE', clave: 'estadisticas.porCategoria.siempre' },
];

function Opciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  opciones: { valor: T; clave: string }[];
  valor: T;
  alCambiar: (valor: T) => void;
}) {
  const intl = useIntl();
  return (
    <div role="group" aria-label={etiqueta} className="flex rounded-md border border-input p-0.5">
      {opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          aria-pressed={valor === opcion.valor}
          onClick={() => alCambiar(opcion.valor)}
          className={cn(
            'rounded px-2 py-0.5 text-xs transition-colors',
            valor === opcion.valor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {intl.formatMessage({ id: opcion.clave })}
        </button>
      ))}
    </div>
  );
}

// "Esta semana, 3 h de Matemáticas y 20 min de Lengua": el tiempo de los
// pomodoros de trabajo repartido por la etiqueta o la asignatura de su tarea.
export function TiempoPorCategoria() {
  const intl = useIntl();
  const modoEscolar = usarSelector((estado) => estado.sesion.usuario?.modoEscolarActivo ?? false);
  const historial = usarSelector(seleccionarHistorialPomodoroDelAmbito);
  // Todas, también las archivadas: su tiempo sigue contando.
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const etiquetas = usarSelector((estado) => estado.etiquetas.lista);
  const [agrupacionElegida, setAgrupacion] = useState<AgrupacionTiempo>('ETIQUETA');
  const [periodo, setPeriodo] = useState<PeriodoTiempo>('SEMANA');
  // Sin modo escolar no hay horario ni asignaturas que mirar.
  const agrupacion = modoEscolar ? agrupacionElegida : 'ETIQUETA';

  const { filas, totalSegundos } = useMemo(
    () => tiempoPorCategoria(historial, tareas, etiquetas, agrupacion, inicioPeriodo(periodo)),
    [historial, tareas, etiquetas, agrupacion, periodo],
  );
  const maximo = Math.max(1, ...filas.map((fila) => fila.segundos));

  function duracion(segundos: number) {
    const minutosTotales = Math.round(segundos / 60);
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return horas > 0
      ? intl.formatMessage({ id: 'estadisticas.porCategoria.horasMinutos' }, { horas, minutos })
      : intl.formatMessage({ id: 'estadisticas.porCategoria.minutos' }, { minutos });
  }

  function nombreFila(clave: string, nombre: string | null) {
    if (nombre !== null) return nombre;
    if (clave === CLAVE_SIN_TAREA) return intl.formatMessage({ id: 'estadisticas.porCategoria.sinTarea' });
    return intl.formatMessage({
      id: agrupacion === 'ASIGNATURA' ? 'estadisticas.porCategoria.sinAsignatura' : 'estadisticas.porCategoria.sinEtiqueta',
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          {intl.formatMessage({
            id: agrupacion === 'ASIGNATURA' ? 'estadisticas.porCategoria.tituloAsignatura' : 'estadisticas.porCategoria.tituloEtiqueta',
          })}
        </CardTitle>
        <div className="no-imprimir flex flex-wrap gap-2">
          {modoEscolar && (
            <Opciones
              etiqueta={intl.formatMessage({ id: 'estadisticas.porCategoria.agrupar' })}
              opciones={[
                { valor: 'ETIQUETA' as const, clave: 'estadisticas.porCategoria.etiquetas' },
                { valor: 'ASIGNATURA' as const, clave: 'estadisticas.porCategoria.asignaturas' },
              ]}
              valor={agrupacion}
              alCambiar={setAgrupacion}
            />
          )}
          <Opciones
            etiqueta={intl.formatMessage({ id: 'estadisticas.porCategoria.periodo' })}
            opciones={PERIODOS}
            valor={periodo}
            alCambiar={setPeriodo}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {totalSegundos === 0 ? (
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'estadisticas.porCategoria.vacio' })}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'estadisticas.porCategoria.total' }, { duracion: duracion(totalSegundos) })}
            </p>
            <ul className="flex flex-col gap-2.5">
              {filas.map((fila) => {
                const especial = fila.nombre === null;
                return (
                  <li key={fila.clave} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={cn('min-w-0 truncate', especial && 'text-muted-foreground italic')}>
                        {nombreFila(fila.clave, fila.nombre)}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <span className="font-medium">{duracion(fila.segundos)}</span>{' '}
                        <span className="text-xs text-muted-foreground">
                          {intl.formatNumber(fila.segundos / totalSegundos, { style: 'percent' })}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(fila.segundos / maximo) * 100}%`,
                          backgroundColor: especial ? 'var(--muted-foreground)' : (fila.color ?? 'var(--primary)'),
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {agrupacion === 'ETIQUETA' && (
              <p className="text-xs text-muted-foreground">
                {intl.formatMessage({ id: 'estadisticas.porCategoria.notaVariasEtiquetas' })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
