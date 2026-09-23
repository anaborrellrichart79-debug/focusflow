import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { FranjaHorario, Horario } from '@/servicios/horarios';
import { cn } from '@/lib/utils';
import { colorTextoSobre } from '@/utilidades/colores';
import { DIAS_LECTIVOS, claveCelda, indexarCeldas, nombreDia } from '@/utilidades/horario';

interface Props {
  horario: Horario;
  editable?: boolean;
  alPulsarCelda?: (franja: FranjaHorario, diaSemana: number) => void;
}

// La cuadrícula del horario, pensada para parecerse a un horario de papel:
// columna de horas, lunes a viernes, cada clase con el color de su
// asignatura y los descansos ocupando toda la fila.
export function CuadriculaHorario({ horario, editable = false, alPulsarCelda }: Props) {
  const intl = useIntl();
  const celdas = useMemo(() => indexarCeldas(horario), [horario]);
  // getDay(): 0 = domingo ... 6 = sábado; coincide con 1-5 de lunes a viernes.
  const hoy = new Date().getDay();

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="w-24 border border-border px-2 py-2 text-left font-medium">
              {intl.formatMessage({ id: 'horario.columnaHora' })}
            </th>
            {DIAS_LECTIVOS.map((dia) => (
              <th
                key={dia}
                scope="col"
                aria-current={dia === hoy ? 'date' : undefined}
                className={cn(
                  'border border-border px-2 py-2 font-medium capitalize',
                  dia === hoy && 'bg-primary/15 text-primary',
                )}
              >
                {nombreDia(dia, intl.locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horario.franjas.map((franja) => (
            <tr key={franja.id}>
              <th
                scope="row"
                className="border border-border bg-muted px-2 py-2 text-left text-xs font-medium tabular-nums whitespace-nowrap"
              >
                {franja.horaInicio} – {franja.horaFin}
              </th>
              {franja.tipo === 'DESCANSO' ? (
                <td
                  colSpan={DIAS_LECTIVOS.length}
                  className="border border-border bg-muted/60 px-2 py-2 text-center text-xs font-semibold tracking-[0.5em] text-muted-foreground uppercase"
                >
                  {franja.etiqueta || intl.formatMessage({ id: 'horario.descanso' })}
                </td>
              ) : (
                DIAS_LECTIVOS.map((dia) => {
                  const celda = celdas.get(claveCelda(franja.id, dia));
                  const contenido = celda ? (
                    <>
                      <span className="block font-semibold leading-tight">
                        {celda.asignatura.asignatura.nombre}
                      </span>
                      {celda.sesion.aula && (
                        <span className="block text-xs opacity-80">{celda.sesion.aula}</span>
                      )}
                    </>
                  ) : editable ? (
                    <span className="text-lg text-muted-foreground">+</span>
                  ) : null;
                  const estilo = celda
                    ? {
                        backgroundColor: celda.asignatura.color,
                        color: colorTextoSobre(celda.asignatura.color),
                      }
                    : undefined;
                  const etiquetaCelda = intl.formatMessage(
                    { id: 'horario.celda' },
                    {
                      dia: nombreDia(dia, intl.locale),
                      hora: franja.horaInicio,
                      asignatura:
                        celda?.asignatura.asignatura.nombre ??
                        intl.formatMessage({ id: 'horario.celdaVacia' }),
                    },
                  );
                  return (
                    <td key={dia} className="h-14 border border-border p-0 text-center" style={estilo}>
                      {editable ? (
                        <button
                          type="button"
                          aria-label={etiquetaCelda}
                          onClick={() => alPulsarCelda?.(franja, dia)}
                          className="flex h-full min-h-14 w-full flex-col items-center justify-center px-1 py-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {contenido}
                        </button>
                      ) : (
                        <div className="flex h-full min-h-14 flex-col items-center justify-center px-1 py-1">
                          {contenido}
                        </div>
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
