import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AvisoPrecioPlus } from '@/componentes/AvisoPrecioPlus';
import { ErrorApi } from '@/servicios/api';
import { leerEntregasDeFoto, type EntregaLeida } from '@/servicios/fotos';
import type { TipoEscolar } from '@/servicios/tareas';
import { OPCIONES_ENTREGAS } from '@/utilidades/planificador';
import { reducirFoto } from '@/utilidades/reducirFoto';
import { ConsejoPlus } from '../ConsejoPlus';
import { useEstadoIa } from '../useEstadoIa';
import { ElegirFoto } from './ElegirFoto';

interface Propuesta extends EntregaLeida {
  elegida: boolean;
}

const CLASE_SELECT = 'h-8 rounded-md border border-input bg-background px-2 text-sm';

// "Añadir desde una foto" en el Planificador: la IA lee un calendario de
// exámenes (o la agenda, o la circular del colegio) y propone las entregas
// con su fecha. Se revisan y se crean como tareas escolares normales, así que
// salen en la Agenda y en los recordatorios.
export function LectorFotoEntregas() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const asignaturas = usarSelector((estado) => estado.horario.activo?.asignaturas ?? []);
  const estadoIa = useEstadoIa();
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anadidas, setAnadidas] = useState<number | null>(null);

  if (!estadoIa) return null;

  async function leer(foto: File) {
    if (!token) return;
    setLeyendo(true);
    setError(null);
    setAnadidas(null);
    setPropuestas(null);
    try {
      const { entregas } = await leerEntregasDeFoto(token, await reducirFoto(foto));
      setPropuestas(entregas.map((entrega) => ({ ...entrega, elegida: true })));
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
    for (const entrega of elegidas) {
      await despachar(
        crearTarea({
          titulo: entrega.titulo.trim(),
          fechaLimite: entrega.fecha,
          ambito: 'ESCOLAR',
          tipoEscolar: entrega.tipo,
          asignaturaHorarioId: entrega.asignaturaHorarioId ?? undefined,
        }),
      );
    }
    setGuardando(false);
    setAnadidas(elegidas.length);
    setPropuestas(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles aria-hidden className="size-4 text-primary" />
          {intl.formatMessage({ id: 'fotos.entregas.boton' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!estadoIa.incluida ? (
          <>
            <ConsejoPlus consejo="examenes" estadoIa={estadoIa} />
            <p className="text-muted-foreground">
              {intl.formatMessage({ id: estadoIa.desactivadaPorFamilia ? 'ia.desactivadaFamilia' : 'fotos.soloPlus' })}
            </p>
            {!estadoIa.desactivadaPorFamilia && <AvisoPrecioPlus />}
          </>
        ) : (
          <>
            {!propuestas && (
              <>
                <p className="text-muted-foreground">{intl.formatMessage({ id: 'fotos.entregas.ayuda' })}</p>
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
            {anadidas !== null && (
              <p role="status" className="text-primary">
                {intl.formatMessage({ id: 'fotos.entregas.anadidas' }, { cantidad: anadidas })}
              </p>
            )}

            {propuestas && (
              <>
                <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'fotos.entregas.revisa' })}</p>
                <ul className="flex flex-col gap-3">
                  {propuestas.map((propuesta, indice) => (
                    <li key={indice} className="flex flex-wrap items-center gap-2 border-b border-border pb-3 last:border-0">
                      <Checkbox
                        checked={propuesta.elegida}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.incluir' }, { titulo: propuesta.titulo })}
                        onCheckedChange={(marcada) => cambiar(indice, { elegida: marcada === true })}
                      />
                      <Input
                        type="date"
                        value={propuesta.fecha}
                        onChange={(evento) => cambiar(indice, { fecha: evento.target.value })}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.fecha' })}
                        className="h-8 w-40 text-sm"
                      />
                      <Input
                        value={propuesta.titulo}
                        onChange={(evento) => cambiar(indice, { titulo: evento.target.value })}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.titulo' })}
                        className="h-8 min-w-48 flex-1 text-sm"
                      />
                      <select
                        value={propuesta.tipo}
                        onChange={(evento) => cambiar(indice, { tipo: evento.target.value as TipoEscolar })}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.tipo' })}
                        className={CLASE_SELECT}
                      >
                        {OPCIONES_ENTREGAS.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>
                            {opcion.icono} {intl.formatMessage({ id: opcion.clave })}
                          </option>
                        ))}
                      </select>
                      <select
                        value={propuesta.asignaturaHorarioId ?? ''}
                        onChange={(evento) => cambiar(indice, { asignaturaHorarioId: evento.target.value || null })}
                        aria-label={intl.formatMessage({ id: 'fotos.entregas.asignatura' })}
                        className={CLASE_SELECT}
                      >
                        <option value="">{intl.formatMessage({ id: 'fotos.sinAsignatura' })}</option>
                        {asignaturas.map((elegida) => (
                          <option key={elegida.id} value={elegida.id}>
                            {elegida.asignatura.nombre}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={anadir} disabled={guardando || elegidas.length === 0}>
                    {intl.formatMessage({ id: 'fotos.entregas.anadir' }, { cantidad: elegidas.length })}
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
