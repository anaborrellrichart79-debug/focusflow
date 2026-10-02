import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { aplicarCuadricula } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvisoPrecioPlus } from '@/componentes/AvisoPrecioPlus';
import { ErrorApi } from '@/servicios/api';
import { leerHorarioDeFoto, type FranjaLeida } from '@/servicios/fotos';
import type { Horario } from '@/servicios/horarios';
import { DIAS_LECTIVOS, nombreDia } from '@/utilidades/horario';
import { reducirFoto } from '@/utilidades/reducirFoto';
import { ConsejoPlus } from '../ConsejoPlus';
import { useEstadoIa } from '../useEstadoIa';
import { ElegirFoto } from './ElegirFoto';

// "Rellenar desde una foto" en la página del horario: la IA lee la foto del
// horario de clase y propone la cuadrícula completa, que se revisa aquí antes
// de aplicarla (sustituye la actual). Lo que falle se corrige después con el
// editor de siempre.
export function LectorFotoHorario({ horario }: { horario: Horario }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const estadoIa = useEstadoIa();
  const [leyendo, setLeyendo] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [propuesta, setPropuesta] = useState<FranjaLeida[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aplicado, setAplicado] = useState(false);

  if (!estadoIa) return null;

  async function leer(foto: File) {
    if (!token) return;
    setLeyendo(true);
    setError(null);
    setAplicado(false);
    setPropuesta(null);
    try {
      const { franjas } = await leerHorarioDeFoto(token, horario.id, await reducirFoto(foto));
      setPropuesta(franjas);
    } catch (causa) {
      setError(causa instanceof ErrorApi ? causa.message : intl.formatMessage({ id: 'fotos.error' }));
    } finally {
      setLeyendo(false);
    }
  }

  async function aplicar() {
    if (!propuesta) return;
    setAplicando(true);
    const resultado = await despachar(
      aplicarCuadricula({
        id: horario.id,
        cuadricula: {
          franjas: propuesta.map((franja) => ({
            horaInicio: franja.horaInicio,
            horaFin: franja.horaFin,
            tipo: franja.tipo,
            etiqueta: franja.etiqueta || undefined,
            clases: franja.clases.map(({ diaSemana, asignaturaId }) => ({ diaSemana, asignaturaId })),
          })),
        },
      }),
    );
    setAplicando(false);
    // Si falla, el error ya lo enseña la página (estado.horario.error).
    if (aplicarCuadricula.fulfilled.match(resultado)) {
      setPropuesta(null);
      setAplicado(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles aria-hidden className="size-4 text-primary" />
          {intl.formatMessage({ id: 'fotos.horario.boton' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!estadoIa.incluida ? (
          <>
            <ConsejoPlus consejo="horario" estadoIa={estadoIa} />
            <p className="text-muted-foreground">
              {intl.formatMessage({ id: estadoIa.desactivadaPorFamilia ? 'ia.desactivadaFamilia' : 'fotos.soloPlus' })}
            </p>
            {!estadoIa.desactivadaPorFamilia && <AvisoPrecioPlus />}
          </>
        ) : (
          <>
            {!propuesta && (
              <>
                <p className="text-muted-foreground">{intl.formatMessage({ id: 'fotos.horario.ayuda' })}</p>
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
            {aplicado && (
              <p role="status" className="text-primary">
                {intl.formatMessage({ id: 'fotos.horario.aplicado' })}
              </p>
            )}

            {propuesta && (
              <>
                <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'fotos.horario.revisa' })}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border border-border px-2 py-1 text-left">
                          {intl.formatMessage({ id: 'horario.columnaHora' })}
                        </th>
                        {DIAS_LECTIVOS.map((dia) => (
                          <th key={dia} className="border border-border px-2 py-1 capitalize">
                            {nombreDia(dia, intl.locale, 'short')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {propuesta.map((franja) => (
                        <tr key={franja.horaInicio}>
                          <td className="border border-border px-2 py-1 whitespace-nowrap tabular-nums">
                            {franja.horaInicio}–{franja.horaFin}
                          </td>
                          {franja.tipo === 'DESCANSO' ? (
                            <td colSpan={5} className="border border-border bg-muted px-2 py-1 text-center">
                              {franja.etiqueta || intl.formatMessage({ id: 'horario.descanso' })}
                            </td>
                          ) : (
                            DIAS_LECTIVOS.map((dia) => (
                              <td key={dia} className="border border-border px-2 py-1">
                                {franja.clases.find((clase) => clase.diaSemana === dia)?.nombre ?? ''}
                              </td>
                            ))
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={aplicar} disabled={aplicando}>
                    {intl.formatMessage({ id: 'fotos.horario.aplicar' })}
                  </Button>
                  <ElegirFoto
                    texto={intl.formatMessage({ id: 'fotos.otraFoto' })}
                    deshabilitado={aplicando || leyendo}
                    alElegir={leer}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setPropuesta(null)} disabled={aplicando}>
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
