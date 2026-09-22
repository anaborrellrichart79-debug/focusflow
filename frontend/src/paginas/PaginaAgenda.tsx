import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DetalleTarea } from '@/componentes/DetalleTarea';
import { obtenerDiasSemana, obtenerSemanasMes, ordenarTareasDelDia, tareasDelDia } from '@/utilidades/agenda';
import { tieneHoraInicio } from '@/utilidades/fechas';

type ModoVista = 'dia' | 'semana' | 'mes';

function alInicioDelDiaUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export function PaginaAgenda() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const idiomaIcu = intl.locale;

  const [modo, setModo] = useState<ModoVista>('semana');
  const [fechaReferencia, setFechaReferencia] = useState(() => alInicioDelDiaUtc(new Date()));

  useEffect(() => {
    despachar(cargarTareas());
  }, [despachar]);

  const formateadorHora = useMemo(
    () => new Intl.DateTimeFormat(idiomaIcu, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
    [idiomaIcu],
  );
  const formateadorDiaCompleto = useMemo(
    () =>
      new Intl.DateTimeFormat(idiomaIcu, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }),
    [idiomaIcu],
  );
  const formateadorDiaCorto = useMemo(
    () => new Intl.DateTimeFormat(idiomaIcu, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }),
    [idiomaIcu],
  );
  const formateadorMes = useMemo(
    () => new Intl.DateTimeFormat(idiomaIcu, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [idiomaIcu],
  );

  function irHoy() {
    setFechaReferencia(alInicioDelDiaUtc(new Date()));
  }

  function mover(delta: number) {
    setFechaReferencia((actual) => {
      const nueva = new Date(actual);
      if (modo === 'dia') nueva.setUTCDate(nueva.getUTCDate() + delta);
      else if (modo === 'semana') nueva.setUTCDate(nueva.getUTCDate() + delta * 7);
      else nueva.setUTCMonth(nueva.getUTCMonth() + delta);
      return nueva;
    });
  }

  function irAlDia(fecha: Date) {
    setFechaReferencia(fecha);
    setModo('dia');
  }

  function renderizarHora(tarea: (typeof tareas)[number]) {
    if (!tarea.fechaLimite || !tieneHoraInicio(tarea.fechaLimite)) return null;
    return formateadorHora.format(new Date(tarea.fechaLimite));
  }

  const tareasDia = useMemo(
    () => ordenarTareasDelDia(tareasDelDia(tareas, fechaReferencia)),
    [tareas, fechaReferencia],
  );
  const diasSemana = useMemo(() => obtenerDiasSemana(fechaReferencia), [fechaReferencia]);
  const semanasMes = useMemo(() => obtenerSemanasMes(fechaReferencia), [fechaReferencia]);
  const mesActual = fechaReferencia.getUTCMonth();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'agenda.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-input p-1">
          {(['dia', 'semana', 'mes'] as const).map((opcion) => (
            <Button
              key={opcion}
              size="sm"
              variant={modo === opcion ? 'default' : 'ghost'}
              onClick={() => setModo(opcion)}
            >
              {intl.formatMessage({ id: `agenda.filtro.${opcion}` })}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => mover(-1)} aria-label={intl.formatMessage({ id: 'agenda.anterior' })}>
            ←
          </Button>
          <Button size="sm" variant="outline" onClick={irHoy}>
            {intl.formatMessage({ id: 'agenda.hoy' })}
          </Button>
          <Button size="sm" variant="outline" onClick={() => mover(1)} aria-label={intl.formatMessage({ id: 'agenda.siguiente' })}>
            →
          </Button>
        </div>
      </div>

      {modo === 'dia' && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <h2 className="text-lg font-medium capitalize">
              {formateadorDiaCompleto.format(fechaReferencia)}
            </h2>
            {tareasDia.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage({ id: 'agenda.sinTareas' })}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tareasDia.map((tarea) => (
                  <li key={tarea.id} className="flex items-center gap-3 text-sm">
                    <span className="w-14 shrink-0 text-muted-foreground">
                      {renderizarHora(tarea) ?? intl.formatMessage({ id: 'agenda.sinHora' })}
                    </span>
                    <DetalleTarea
                      tarea={tarea}
                      className={
                        tarea.estado === 'HECHA'
                          ? 'text-left line-through text-muted-foreground hover:underline'
                          : 'text-left hover:underline'
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {modo === 'semana' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {diasSemana.map((dia) => {
            const tareasDelDiaActual = ordenarTareasDelDia(tareasDelDia(tareas, dia));
            const esHoy = dia.getTime() === alInicioDelDiaUtc(new Date()).getTime();
            return (
              <Card key={dia.toISOString()} className={esHoy ? 'border-primary' : undefined}>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => irAlDia(dia)}
                    className="text-left text-xs font-medium capitalize hover:underline"
                  >
                    {formateadorDiaCorto.format(dia)}
                  </button>
                  {tareasDelDiaActual.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {intl.formatMessage({ id: 'agenda.sinTareas' })}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {tareasDelDiaActual.map((tarea) => (
                        <li key={tarea.id} className="text-xs">
                          {renderizarHora(tarea) && (
                            <span className="text-muted-foreground">{renderizarHora(tarea)} </span>
                          )}
                          <DetalleTarea
                            tarea={tarea}
                            className={
                              tarea.estado === 'HECHA'
                                ? 'line-through text-muted-foreground hover:underline'
                                : 'hover:underline'
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {modo === 'mes' && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <h2 className="text-lg font-medium capitalize">{formateadorMes.format(fechaReferencia)}</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {semanasMes.map((semana) =>
                semana.map((dia) => {
                  const tareasDelDiaActual = tareasDelDia(tareas, dia);
                  const delMesActual = dia.getUTCMonth() === mesActual;
                  const esHoy = dia.getTime() === alInicioDelDiaUtc(new Date()).getTime();
                  return (
                    <button
                      key={dia.toISOString()}
                      type="button"
                      onClick={() => irAlDia(dia)}
                      className={[
                        'flex min-h-20 flex-col items-start gap-0.5 rounded-md border p-1.5 text-left text-xs',
                        delMesActual ? '' : 'text-muted-foreground opacity-50',
                        esHoy ? 'border-primary' : 'border-transparent',
                      ].join(' ')}
                    >
                      <span className="font-medium">{dia.getUTCDate()}</span>
                      {tareasDelDiaActual.slice(0, 3).map((tarea) => (
                        <span key={tarea.id} className="w-full truncate text-muted-foreground">
                          {tarea.titulo}
                        </span>
                      ))}
                      {tareasDelDiaActual.length > 3 && (
                        <span className="text-muted-foreground">
                          {intl.formatMessage(
                            { id: 'agenda.masTareas' },
                            { cantidad: tareasDelDiaActual.length - 3 },
                          )}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
