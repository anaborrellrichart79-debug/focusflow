import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarObjetivos, crearObjetivo } from '@/almacen/objetivosSlice';
import {
  alternarCompletadaTarea,
  cargarTareas,
  crearTarea,
  eliminarTarea,
} from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ObjetivoTarjeta } from '@/componentes/ObjetivoTarjeta';

export function PaginaObjetivos() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const objetivos = usarSelector((estado) => estado.objetivos.lista);
  const tareasSueltas = usarSelector((estado) =>
    estado.tareas.lista.filter((tarea) => tarea.objetivoId === null),
  );

  const [tituloObjetivo, setTituloObjetivo] = useState('');
  const [descripcionObjetivo, setDescripcionObjetivo] = useState('');
  const [tituloTareaSuelta, setTituloTareaSuelta] = useState('');

  useEffect(() => {
    despachar(cargarObjetivos());
    despachar(cargarTareas());
  }, [despachar]);

  function alCrearObjetivo(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloObjetivo.trim()) return;
    despachar(
      crearObjetivo({
        titulo: tituloObjetivo,
        descripcion: descripcionObjetivo || undefined,
      }),
    );
    setTituloObjetivo('');
    setDescripcionObjetivo('');
  }

  function alAnadirTareaSuelta(evento: React.FormEvent) {
    evento.preventDefault();
    if (!tituloTareaSuelta.trim()) return;
    despachar(crearTarea({ titulo: tituloTareaSuelta }));
    setTituloTareaSuelta('');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'objetivos.titulo' })}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
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
              <li key={tarea.id} className="flex items-center gap-2">
                <Checkbox
                  checked={tarea.completada}
                  onCheckedChange={(marcada) =>
                    despachar(
                      alternarCompletadaTarea({
                        id: tarea.id,
                        completada: marcada === true,
                      }),
                    )
                  }
                />
                <span
                  className={
                    tarea.completada
                      ? 'flex-1 text-sm line-through text-muted-foreground'
                      : 'flex-1 text-sm'
                  }
                >
                  {tarea.titulo}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={intl.formatMessage({ id: 'tareas.eliminar' })}
                  onClick={() => despachar(eliminarTarea(tarea.id))}
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
          <form onSubmit={alAnadirTareaSuelta} className="flex gap-2">
            <Input
              value={tituloTareaSuelta}
              onChange={(evento) => setTituloTareaSuelta(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
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
