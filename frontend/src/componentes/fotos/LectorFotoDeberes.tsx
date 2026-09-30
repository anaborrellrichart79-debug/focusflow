import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ErrorApi } from '@/servicios/api';
import { leerDeberesDeFoto, type DeberLeido } from '@/servicios/fotos';
import { fechaDeHoy, proximaClase, type PeriodoSinClase } from '@/utilidades/deberes';
import { reducirFoto } from '@/utilidades/reducirFoto';
import { useEstadoIa } from '../useEstadoIa';
import { ElegirFoto } from './ElegirFoto';

interface Propuesta extends DeberLeido {
  fecha: string;
  // La fecha venía escrita en la agenda (o la ha puesto el usuario): cambiar
  // la asignatura ya no la recalcula.
  fechaFija: boolean;
  elegida: boolean;
}

const CLASE_SELECT = 'h-8 rounded-md border border-input bg-background px-2 text-sm';

// "Añadir desde una foto de la agenda" en la pestaña Deberes: la IA saca los
// deberes de cada asignatura de la página de la agenda escolar. Si la agenda
// no dice para cuándo son, se propone la próxima clase de esa asignatura.
export function LectorFotoDeberes({ sinClase }: { sinClase: PeriodoSinClase[] }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const horario = usarSelector((estado) => estado.horario.activo);
  const estadoIa = useEstadoIa();
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anadidos, setAnadidos] = useState<number | null>(null);

  if (!estadoIa) return null;

  async function leer(foto: File) {
    if (!token) return;
    setLeyendo(true);
    setError(null);
    setAnadidos(null);
    setPropuestas(null);
    try {
      const { deberes } = await leerDeberesDeFoto(token, await reducirFoto(foto));
      const hoy = fechaDeHoy();
      setPropuestas(
        deberes.map((deber) => ({
          ...deber,
          fecha: deber.fecha ?? proximaClase(horario, deber.asignaturaHorarioId, hoy, sinClase),
          fechaFija: deber.fecha !== null,
          elegida: true,
        })),
      );
    } catch (causa) {
      setError(causa instanceof ErrorApi ? causa.message : intl.formatMessage({ id: 'fotos.error' }));
    } finally {
      setLeyendo(false);
    }
  }

  function cambiar(indice: number, cambios: Partial<Propuesta>) {
    setPropuestas((actuales) => actuales?.map((p, i) => (i === indice ? { ...p, ...cambios } : p)) ?? null);
  }

  const elegidas = (propuestas ?? []).filter((p) => p.elegida && p.titulo.trim() && p.fecha);

  async function anadir() {
    setGuardando(true);
    for (const deber of elegidas) {
      await despachar(
        crearTarea({
          titulo: deber.titulo.trim(),
          fechaLimite: deber.fecha,
          ambito: 'ESCOLAR',
          tipoEscolar: 'DEBERES',
          asignaturaHorarioId: deber.asignaturaHorarioId ?? undefined,
        }),
      );
    }
    setGuardando(false);
    setAnadidos(elegidas.length);
    setPropuestas(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles aria-hidden className="size-4 text-primary" />
          {intl.formatMessage({ id: 'fotos.deberes.boton' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!estadoIa.incluida ? (
          <p className="text-muted-foreground">{intl.formatMessage({ id: 'fotos.soloPlus' })}</p>
        ) : (
          <>
            {!propuestas && (
              <>
                <p className="text-muted-foreground">{intl.formatMessage({ id: 'fotos.deberes.ayuda' })}</p>
                <div>
                  <ElegirFoto
                    texto={intl.formatMessage({ id: 'fotos.elegir' })}
                    deshabilitado={leyendo}
                    alElegir={leer}
                  />
                </div>
              </>
            )}
            {leyendo && (
              <p role="status" className="text-muted-foreground">
                {intl.formatMessage({ id: 'fotos.leyendo' })}
              </p>
            )}
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            {anadidos !== null && (
              <p role="status" className="text-primary">
                {intl.formatMessage({ id: 'fotos.deberes.anadidos' }, { cantidad: anadidos })}
              </p>
            )}

            {propuestas && (
              <>
                <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'fotos.deberes.revisa' })}</p>
                <ul className="flex flex-col gap-3">
                  {propuestas.map((propuesta, indice) => (
                    <li key={indice} className="flex flex-wrap items-center gap-2 border-b border-border pb-3 last:border-0">
                      <Checkbox
                        checked={propuesta.elegida}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.incluir' }, { titulo: propuesta.titulo })}
                        onCheckedChange={(marcada) => cambiar(indice, { elegida: marcada === true })}
                      />
                      <select
                        value={propuesta.asignaturaHorarioId ?? ''}
                        onChange={(evento) => {
                          const asignaturaHorarioId = evento.target.value || null;
                          // Otra asignatura, otra "próxima clase" (salvo fecha fija).
                          cambiar(indice, {
                            asignaturaHorarioId,
                            ...(propuesta.fechaFija
                              ? {}
                              : { fecha: proximaClase(horario, asignaturaHorarioId, fechaDeHoy(), sinClase) }),
                          });
                        }}
                        aria-label={intl.formatMessage({ id: 'deberes.nuevo.asignatura' })}
                        className={CLASE_SELECT}
                      >
                        <option value="">{intl.formatMessage({ id: 'fotos.sinAsignatura' })}</option>
                        {(horario?.asignaturas ?? []).map((elegida) => (
                          <option key={elegida.id} value={elegida.id}>
                            {elegida.asignatura.nombre}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={propuesta.titulo}
                        onChange={(evento) => cambiar(indice, { titulo: evento.target.value })}
                        aria-label={intl.formatMessage({ id: 'deberes.nuevo.que' })}
                        className="h-8 min-w-48 flex-1 text-sm"
                      />
                      <Input
                        type="date"
                        value={propuesta.fecha}
                        onChange={(evento) => cambiar(indice, { fecha: evento.target.value, fechaFija: true })}
                        aria-label={intl.formatMessage({ id: 'deberes.nuevo.fecha' })}
                        className="h-8 w-40 text-sm"
                      />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={anadir} disabled={guardando || elegidas.length === 0}>
                    {intl.formatMessage({ id: 'fotos.deberes.anadir' }, { cantidad: elegidas.length })}
                  </Button>
                  <ElegirFoto
                    texto={intl.formatMessage({ id: 'fotos.otraFoto' })}
                    deshabilitado={guardando || leyendo}
                    alElegir={leer}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setPropuestas(null)} disabled={guardando}>
                    {intl.formatMessage({ id: 'fotos.descartar' })}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
