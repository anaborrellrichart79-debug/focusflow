import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarEtiquetas } from '@/almacen/etiquetasSlice';
import { cambiarEstadoTarea, cargarTareas, crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DetalleTarea } from '@/componentes/DetalleTarea';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { IndicadoresTarea } from '@/componentes/IndicadoresTarea';
import type { Tarea, TipoEscolar } from '@/servicios/tareas';
import {
  OPCIONES_TIPO_ESCOLAR,
  agruparEntregasEscolares,
  type EntregasAgrupadas,
} from '@/utilidades/planificador';

const SECCIONES: { grupo: keyof EntregasAgrupadas; clave: string; ocultarSiVacia: boolean }[] = [
  { grupo: 'vencidas', clave: 'planificador.seccion.vencidas', ocultarSiVacia: true },
  { grupo: 'estaSemana', clave: 'planificador.seccion.estaSemana', ocultarSiVacia: false },
  { grupo: 'masAdelante', clave: 'planificador.seccion.masAdelante', ocultarSiVacia: false },
  { grupo: 'sinFecha', clave: 'planificador.seccion.sinFecha', ocultarSiVacia: true },
];

const FILTROS: { valor: TipoEscolar | 'TODOS'; clave: string; icono: string }[] = [
  { valor: 'TODOS', clave: 'planificador.filtro.todos', icono: '' },
  ...OPCIONES_TIPO_ESCOLAR.map((opcion) => ({ ...opcion, clave: `${opcion.clave}.plural` })),
];

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Vista de todo lo escolar con fecha: exámenes, trabajos y presentaciones.
// No depende del ámbito activo de la barra lateral: esta página ya es, por
// definición, solo del ámbito escolar.
export function PaginaPlanificador() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.tareas.lista);
  const [filtroTipo, setFiltroTipo] = useState<TipoEscolar | 'TODOS'>('TODOS');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoEscolar>('EXAMEN');
  const [fecha, setFecha] = useState('');
  const [asignaturaHorarioId, setAsignaturaHorarioId] = useState('');
  const asignaturasHorario = usarSelector(
    (estado) => estado.horario.activo?.asignaturas ?? [],
  );

  useEffect(() => {
    despachar(cargarTareas());
    despachar(cargarEtiquetas());
  }, [despachar]);

  const grupos = useMemo(() => agruparEntregasEscolares(tareas, filtroTipo), [tareas, filtroTipo]);
  const hayEntregas = Object.values(grupos).some((lista) => lista.length > 0);

  function alAnadir(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !fecha) return;
    despachar(
      crearTarea({
        titulo,
        fechaLimite: fecha,
        ambito: 'ESCOLAR',
        tipoEscolar: tipo,
        // La asignatura sale del horario de clase activo (con su color).
        asignaturaHorarioId: asignaturaHorarioId || undefined,
      }),
    );
    setTitulo('');
    setFecha('');
  }

  function renderizarEntrega(tarea: Tarea) {
    return (
      <li key={tarea.id} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Checkbox
            aria-label={intl.formatMessage(
              { id: 'planificador.marcarHecha' },
              { titulo: tarea.titulo },
            )}
            checked={false}
            onCheckedChange={() =>
              despachar(cambiarEstadoTarea({ id: tarea.id, estado: 'HECHA' }))
            }
          />
          <DetalleTarea tarea={tarea} className="flex-1 text-left text-sm hover:underline" />
          {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
        </div>
        <div className="pl-6">
          <IndicadoresTarea tarea={tarea} />
        </div>
      </li>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'planificador.titulo' })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'planificador.descripcion' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'planificador.nueva.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alAnadir} className="flex flex-col gap-3">
            <Input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'planificador.nueva.tituloPlaceholder' })}
              aria-label={intl.formatMessage({ id: 'planificador.nueva.tituloPlaceholder' })}
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value as TipoEscolar)}
                aria-label={intl.formatMessage({ id: 'tarea.detalle.tipoEscolar' })}
                className={CLASE_SELECT}
              >
                {OPCIONES_TIPO_ESCOLAR.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.icono} {intl.formatMessage({ id: opcion.clave })}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                required
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                aria-label={intl.formatMessage({ id: 'tarea.detalle.fechaLimite' })}
                className="w-auto"
              />
              {asignaturasHorario.length > 0 ? (
                <select
                  value={asignaturaHorarioId}
                  onChange={(evento) => setAsignaturaHorarioId(evento.target.value)}
                  aria-label={intl.formatMessage({ id: 'tarea.detalle.asignatura' })}
                  className={`${CLASE_SELECT} min-w-32 flex-1`}
                >
                  <option value="">{intl.formatMessage({ id: 'tarea.detalle.sinAsignatura' })}</option>
                  {asignaturasHorario.map((elegida) => (
                    <option key={elegida.id} value={elegida.id}>
                      {elegida.asignatura.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <Link to="/horario" className="self-center text-sm text-primary hover:underline">
                  {intl.formatMessage({ id: 'planificador.sinHorario' })}
                </Link>
              )}
            </div>
            <Button type="submit">{intl.formatMessage({ id: 'planificador.nueva.boton' })}</Button>
          </form>
        </CardContent>
      </Card>

      <div
        role="group"
        aria-label={intl.formatMessage({ id: 'planificador.filtro' })}
        className="flex flex-wrap gap-2"
      >
        {FILTROS.map((opcion) => (
          <Button
            key={opcion.valor}
            type="button"
            size="sm"
            variant={filtroTipo === opcion.valor ? 'default' : 'outline'}
            aria-pressed={filtroTipo === opcion.valor}
            onClick={() => setFiltroTipo(opcion.valor)}
          >
            {opcion.icono && <span aria-hidden>{opcion.icono}</span>}
            {intl.formatMessage({ id: opcion.clave })}
          </Button>
        ))}
      </div>

      {!hayEntregas ? (
        <p className="text-center text-muted-foreground">
          {intl.formatMessage({ id: 'planificador.vacio' })}
        </p>
      ) : (
        SECCIONES.filter(
          (seccion) => !seccion.ocultarSiVacia || grupos[seccion.grupo].length > 0,
        ).map((seccion) => (
          <Card key={seccion.grupo}>
            <CardHeader>
              <CardTitle
                className={
                  seccion.grupo === 'vencidas'
                    ? 'text-sm uppercase tracking-wide text-destructive'
                    : 'text-sm uppercase tracking-wide text-muted-foreground'
                }
              >
                {intl.formatMessage(
                  { id: seccion.clave },
                  { cantidad: grupos[seccion.grupo].length },
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grupos[seccion.grupo].length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: 'planificador.seccion.vacia' })}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {grupos[seccion.grupo].map(renderizarEntrega)}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
