import { useIntl } from 'react-intl';
import { construirSemanasActividad } from '@/utilidades/actividad';

const SEMANAS = 14;
const PORCENTAJES_NIVEL = [28, 52, 76, 100];

export function MapaActividad({ fechasIso }: { fechasIso: string[] }) {
  const intl = useIntl();
  const semanas = construirSemanasActividad(fechasIso, SEMANAS);
  const maxCantidad = Math.max(1, ...semanas.flat().map((dia) => dia.cantidad));

  function colorDia(cantidad: number) {
    if (cantidad === 0) return 'var(--muted)';
    const nivel = Math.min(4, Math.ceil((cantidad / maxCantidad) * 4));
    return `color-mix(in oklch, var(--primary) ${PORCENTAJES_NIVEL[nivel - 1]}%, var(--muted))`;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {semanas.map((semana, indice) => (
          <div key={indice} className="flex flex-col gap-1">
            {semana.map((dia) => (
              <div
                key={dia.fecha.toISOString()}
                title={`${intl.formatDate(dia.fecha, { dateStyle: 'medium' })} · ${intl.formatMessage(
                  { id: 'estadisticas.actividad.tooltip' },
                  { cantidad: dia.cantidad },
                )}`}
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: colorDia(dia.cantidad) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{intl.formatMessage({ id: 'estadisticas.actividad.menos' })}</span>
        <div className="flex gap-1">
          <div className="size-3 rounded-sm" style={{ backgroundColor: 'var(--muted)' }} />
          {PORCENTAJES_NIVEL.map((porcentaje) => (
            <div
              key={porcentaje}
              className="size-3 rounded-sm"
              style={{
                backgroundColor: `color-mix(in oklch, var(--primary) ${porcentaje}%, var(--muted))`,
              }}
            />
          ))}
        </div>
        <span>{intl.formatMessage({ id: 'estadisticas.actividad.mas' })}</span>
      </div>
    </div>
  );
}
