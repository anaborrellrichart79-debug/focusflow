import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarEstadoTarea, crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { obtenerCalendarioEscolar } from '@/servicios/recordatorios';
import type { Tarea } from '@/servicios/tareas';
import {
  agruparDeberes,
  fechaDeHoy,
  proximaClase,
  type DeberesAgrupados,
  type PeriodoSinClase,
} from '@/utilidades/deberes';
import { DetalleTarea } from './DetalleTarea';
import { EtiquetaFechaLimite } from './EtiquetaFechaLimite';
import { IndicadoresTarea } from './IndicadoresTarea';
import { LectorFotoDeberes } from './fotos/LectorFotoDeberes';

const SECCIONES: { grupo: keyof DeberesAgrupados; clave: string; ocultarSiVacia: boolean }[] = [
  { grupo: 'atrasados', clave: 'deberes.seccion.atrasados', ocultarSiVacia: true },
  { grupo: 'hoy', clave: 'deberes.seccion.hoy', ocultarSiVacia: true },
  { grupo: 'manana', clave: 'deberes.seccion.manana', ocultarSiVacia: false },
  { grupo: 'masAdelante', clave: 'deberes.seccion.masAdelante', ocultarSiVacia: true },
];

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Pestaña "Deberes" del Planificador: los deberes de cada día de la agenda
// escolar, aparte de los exámenes y trabajos. Al apuntarlos, la fecha es la
// próxima clase de esa asignatura según el horario (se puede cambiar).
export function PestanaDeberes() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const horario = usarSelector((estado) => estado.horario.activo);
  const [sinClase, setSinClase] = useState<PeriodoSinClase[]>([]);
  const [asignaturaHorarioId, setAsignaturaHorarioId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  // Si el usuario ha tocado la fecha, cambiar de asignatura ya no la pisa.
  const [fechaTocada, setFechaTocada] = useState(false);

  // Vacaciones y festivos (de la comunidad y los propios): no son "próxima clase".
  useEffect(() => {
    if (!token) return;
    let vigente = true;
    obtenerCalendarioEscolar(token)
      .then((calendario) => vigente && setSinClase([...calendario.periodos, ...calendario.propios]))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [token]);

  const hoy = fechaDeHoy();
  const fechaPropuesta = proximaClase(horario, asignaturaHorarioId || null, hoy, sinClase);
  const fechaElegida = fechaTocada ? fecha : fechaPropuesta;
  const grupos = useMemo(() => agruparDeberes(tareas, hoy), [tareas, hoy]);
  const hayDeberes = Object.values(grupos).some((lista) => lista.length > 0);

  function alApuntar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !fechaElegida) return;
    despachar(
      crearTarea({
        titulo: titulo.trim(),
        fechaLimite: fechaElegida,
        ambito: 'ESCOLAR',
        tipoEscolar: 'DEBERES',
        asignaturaHorarioId: asignaturaHorarioId || undefined,
      }),
    );
    // La asignatura se queda: lo normal es apuntar varios seguidos de la agenda.
    setTitulo('');
    setFechaTocada(false);
  }

  function renderizarDeber(tarea: Tarea) {
    return (
      <li key={tarea.id} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Checkbox
            aria-label={intl.formatMessage({ id: 'planificador.marcarHecha' }, { titulo: tarea.titulo })}
            checked={false}
            onCheckedChange={() => despachar(cambiarEstadoTarea({ id: tarea.id, estado: 'HECHA' }))}
          />
          <DetalleTarea tarea={tarea} className="flex-1 text-left text-sm hover:underline" />
          {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
        </div>
        <div className="pl-6">
          {/* Con la asignatura (y su color) del horario. */}
          <IndicadoresTarea tarea={tarea} />
        </div>
      </li>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'deberes.nuevo.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alApuntar} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <select
                aria-label={intl.formatMessage({ id: 'deberes.nuevo.asignatura' })}
                value={asignaturaHorarioId}
                onChange={(evento) => setAsignaturaHorarioId(evento.target.value)}
                className={`${CLASE_SELECT} min-w-40`}
              >
                <option value="">{intl.formatMessage({ id: 'fotos.sinAsignatura' })}</option>
                {(horario?.asignaturas ?? []).map((elegida) => (
                  <option key={elegida.id} value={elegida.id}>
                    {elegida.asignatura.nombre}
                  </option>
                ))}
              </select>
              <Input
                aria-label={intl.formatMessage({ id: 'deberes.nuevo.que' })}
                placeholder={intl.formatMessage({ id: 'deberes.nuevo.ejemplo' })}
                value={titulo}
                onChange={(evento) => setTitulo(evento.target.value)}
                className="min-w-48 flex-1"
              />
              <label className="flex items-center gap-2 text-sm">
                {intl.formatMessage({ id: 'deberes.nuevo.fecha' })}
                <Input
                  type="date"
                  value={fechaElegida}
                  onChange={(evento) => {
                    setFecha(evento.target.value);
                    setFechaTocada(true);
                  }}
                  className="w-40"
                />
              </label>
            </div>
            {horario ? (
              <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'deberes.nuevo.ayuda' })}</p>
            ) : (
              <Link to="/horario" className="text-xs text-primary hover:underline">
                {intl.formatMessage({ id: 'deberes.sinHorario' })}
              </Link>
            )}
            <div>
              <Button type="submit" disabled={!titulo.trim()}>
                {intl.formatMessage({ id: 'deberes.nuevo.boton' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <LectorFotoDeberes sinClase={sinClase} />

      {!hayDeberes ? (
        <p className="text-center text-muted-foreground">{intl.formatMessage({ id: 'deberes.vacio' })}</p>
      ) : (
        SECCIONES.filter((seccion) => !seccion.ocultarSiVacia || grupos[seccion.grupo].length > 0).map(
          (seccion) => (
            <Card key={seccion.grupo}>
              <CardHeader>
                <CardTitle className={seccion.grupo === 'atrasados' ? 'text-destructive' : undefined}>
                  {intl.formatMessage({ id: seccion.clave })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grupos[seccion.grupo].length === 0 ? (
                  <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'deberes.vacio' })}</p>
                ) : (
                  <ul className="flex flex-col gap-3">{grupos[seccion.grupo].map(renderizarDeber)}</ul>
                )}
              </CardContent>
            </Card>
          ),
        )
      )}
    </>
  );
}
