import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { seleccionarObjetivosDelAmbito, seleccionarTareasDelAmbito } from '@/almacen/selectores';
import { cargarEtiquetas } from '@/almacen/etiquetasSlice';
import { cargarObjetivos, crearObjetivo } from '@/almacen/objetivosSlice';
import {
  cambiarEstadoTarea,
  cargarTareas,
  crearTarea,
  eliminarTarea,
} from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DetalleTarea } from '@/componentes/DetalleTarea';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { IndicadoresTarea } from '@/componentes/IndicadoresTarea';
import { ObjetivoTarjeta } from '@/componentes/ObjetivoTarjeta';

export function PaginaObjetivos() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const objetivos = usarSelector(seleccionarObjetivosDelAmbito);
  const tareasDelAmbito = usarSelector(seleccionarTareasDelAmbito);
  const tareasSueltas = useMemo(
    () => tareasDelAmbito.filter((tarea) => tarea.objetivoId === null),
    [tareasDelAmbito],
  );

  const [tituloObjetivo, setTituloObjetivo] = useState('');
  const [descripcionObjetivo, setDescripcionObjetivo] = useState('');
  const [fechaLimiteObjetivo, setFechaLimiteObjetivo] = useState('');
  const [tituloTareaSuelta, setTituloTareaSuelta] = useState('');
  const [fechaLimiteTareaSuelta, setFechaLimiteTareaSuelta] = useState('');

  useEffect(() => {
    despachar(cargarObjetivos());
    despachar(cargarTareas());
    despachar(cargarEtiquetas());
  }, [despachar]);

  function alCrearObjetivo(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloObjetivo.trim()) return;
    despachar(
      crearObjetivo({
        titulo: tituloObjetivo,
        descripcion: descripcionObjetivo || undefined,
        fechaLimite: fechaLimiteObjetivo || undefined,
      }),
    );
    setTituloObjetivo('');
    setDescripcionObjetivo('');
    setFechaLimiteObjetivo('');
  }

  function alAnadirTareaSuelta(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloTareaSuelta.trim()) return;
    despachar(
      crearTarea({ titulo: tituloTareaSuelta, fechaLimite: fechaLimiteTareaSuelta || undefined }),
    );
    setTituloTareaSuelta('');
    setFechaLimiteTareaSuelta('');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'objetivos.titulo' })}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'objetivos.nuevo.boton' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alCrearObjetivo} className="flex flex-col gap-3">
            <Input
              value={tituloObjetivo}
              onChange={(evento) => setTituloObjetivo(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'objetivos.nuevo.tituloPlaceholder' })}
            />
            <Input
              value={descripcionObjetivo}
              onChange={(evento) => setDescripcionObjetivo(evento.target.value)}
              placeholder={intl.formatMessage({
                id: 'objetivos.nuevo.descripcionPlaceholder',
              })}
            />
            <Input
              type="date"
              value={fechaLimiteObjetivo}
              onChange={(evento) => setFechaLimiteObjetivo(evento.target.value)}
              aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
            />
            <Button type="submit">
              {intl.formatMessage({ id: 'objetivos.nuevo.boton' })}
            </Button>
          </form>
        </CardContent>
      </Card>

      {objetivos.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {intl.formatMessage({ id: 'objetivos.vacio' })}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {objetivos.map((objetivo) => (
            <ObjetivoTarjeta key={objetivo.id} objetivo={objetivo} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'tareas.sueltas.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {tareasSueltas.map((tarea) => (
              <li key={tarea.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tarea.estado === 'HECHA'}
                    onCheckedChange={(marcada) =>
                      despachar(
                        cambiarEstadoTarea({
                          id: tarea.id,
                          estado: marcada === true ? 'HECHA' : 'POR_HACER',
                        }),
                      )
                    }
                  />
                  <DetalleTarea
                    tarea={tarea}
                    className={
                      tarea.estado === 'HECHA'
                        ? 'flex-1 text-left text-sm line-through text-muted-foreground hover:no-underline'
                        : 'flex-1 text-left text-sm hover:underline'
                    }
                  />
                  {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                    onClick={() => despachar(eliminarTarea(tarea.id))}
                  >
                    ✕
                  </Button>
                </div>
                <IndicadoresTarea tarea={tarea} />
              </li>
            ))}
          </ul>
          <form onSubmit={alAnadirTareaSuelta} className="flex flex-wrap gap-2">
            <Input
              value={tituloTareaSuelta}
              onChange={(evento) => setTituloTareaSuelta(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
              className="min-w-32 flex-1"
            />
            <Input
              type="date"
              value={fechaLimiteTareaSuelta}
              onChange={(evento) => setFechaLimiteTareaSuelta(evento.target.value)}
              aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
              className="w-auto"
            />
            <Button type="submit" size="sm">
              {intl.formatMessage({ id: 'tareas.anadir' })}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
