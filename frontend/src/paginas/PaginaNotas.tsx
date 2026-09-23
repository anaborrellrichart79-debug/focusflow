import { useEffect, useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { anadirNota, cargarNotas } from '@/almacen/notasSlice';
import { cargarObjetivos } from '@/almacen/objetivosSlice';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FilaNota } from '@/componentes/FilaNota';
import type { TipoNota } from '@/servicios/notas';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Valor de los desplegables de vínculo: "tarea:<id>", "objetivo:<id>" o "".
function aVinculo(valor: string) {
  const [tipo, id] = valor.split(':');
  return {
    tareaId: tipo === 'tarea' ? id : null,
    objetivoId: tipo === 'objetivo' ? id : null,
  };
}

function OpcionesVinculo({ claveVacia = 'notas.sinVinculo' }: { claveVacia?: string }) {
  const intl = useIntl();
  const tareas = usarSelector((estado) => estado.tareas.lista).filter(
    (tarea) => tarea.estado !== 'ARCHIVADA',
  );
  const objetivos = usarSelector((estado) => estado.objetivos.lista);

  return (
    <>
      <option value="">{intl.formatMessage({ id: claveVacia })}</option>
      {objetivos.length > 0 && (
        <optgroup label={intl.formatMessage({ id: 'notas.objetivos' })}>
          {objetivos.map((objetivo) => (
            <option key={objetivo.id} value={`objetivo:${objetivo.id}`}>
              {objetivo.titulo}
            </option>
          ))}
        </optgroup>
      )}
      {tareas.length > 0 && (
        <optgroup label={intl.formatMessage({ id: 'notas.tareas' })}>
          {tareas.map((tarea) => (
            <option key={tarea.id} value={`tarea:${tarea.id}`}>
              {tarea.titulo}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

// Un apartado con dos pestañas: Notas (texto libre, con casilla opcional) y
// To-Do (elementos cortos que se marcan como hechos). Los dos se pueden
// asociar a una tarea o a un objetivo; ?tarea=<id> u ?objetivo=<id> filtra.
export function PaginaNotas() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [parametros, setParametros] = useSearchParams();
  const { lista, error } = usarSelector((estado) => estado.notas);
  const pestana: TipoNota = parametros.get('pestana') === 'todo' ? 'TODO' : 'NOTA';
  const filtroTarea = parametros.get('tarea');
  const filtroObjetivo = parametros.get('objetivo');
  const filtro = filtroTarea ? `tarea:${filtroTarea}` : filtroObjetivo ? `objetivo:${filtroObjetivo}` : '';

  useEffect(() => {
    despachar(cargarNotas());
    despachar(cargarTareas());
    despachar(cargarObjetivos());
  }, [despachar]);

  function cambiarParametro(clave: string, valor: string | null) {
    const nuevos = new URLSearchParams(parametros);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    setParametros(nuevos, { replace: true });
  }

  function cambiarFiltro(valor: string) {
    const { tareaId, objetivoId } = aVinculo(valor);
    const nuevos = new URLSearchParams(parametros);
    nuevos.delete('tarea');
    nuevos.delete('objetivo');
    if (tareaId) nuevos.set('tarea', tareaId);
    if (objetivoId) nuevos.set('objetivo', objetivoId);
    setParametros(nuevos, { replace: true });
  }

  const visibles = lista.filter(
    (nota) =>
      nota.tipo === pestana &&
      (!filtroTarea || nota.tareaId === filtroTarea) &&
      (!filtroObjetivo || nota.objetivoId === filtroObjetivo),
  );
  const pendientesTodo = lista.filter((nota) => nota.tipo === 'TODO' && !nota.completada).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {intl.formatMessage({ id: 'notas.titulo' })}
      </h1>

      <div
        role="tablist"
        aria-label={intl.formatMessage({ id: 'notas.titulo' })}
        className="flex w-fit rounded-full border border-border bg-background p-0.5 shadow-sm"
      >
        {(['NOTA', 'TODO'] as const).map((tipo) => (
          <Button
            key={tipo}
            role="tab"
            aria-selected={pestana === tipo}
            size="sm"
            variant={pestana === tipo ? 'default' : 'ghost'}
            className="rounded-full"
            onClick={() => cambiarParametro('pestana', tipo === 'TODO' ? 'todo' : null)}
          >
            {intl.formatMessage({ id: tipo === 'NOTA' ? 'notas.pestana.notas' : 'notas.pestana.todo' })}
            {tipo === 'TODO' && pendientesTodo > 0 && (
              <span className="ml-1 text-xs opacity-80">({pendientesTodo})</span>
            )}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Al filtrar por una tarea u objetivo, lo nuevo se asocia a ella por
          defecto: la key vuelve a montar el formulario con ese vínculo. */}
      <FormularioNota key={filtro} tipo={pestana} vinculoInicial={filtro} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          {intl.formatMessage({ id: 'notas.filtrar' })}
          <select
            value={filtro}
            onChange={(evento) => cambiarFiltro(evento.target.value)}
            className={CLASE_SELECT}
          >
            <OpcionesVinculo claveVacia="notas.filtrar.todas" />
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: pestana === 'NOTA' ? 'notas.vacio' : 'notas.todo.vacio' })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.map((nota) => (
            <FilaNota key={nota.id} nota={nota} />
          ))}
        </ul>
      )}
    </main>
  );
}

function FormularioNota({ tipo, vinculoInicial }: { tipo: TipoNota; vinculoInicial: string }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [contenido, setContenido] = useState('');
  const [conCasilla, setConCasilla] = useState(false);
  const [vinculo, setVinculo] = useState(vinculoInicial);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { tareaId, objetivoId } = aVinculo(vinculo);
    const resultado = await despachar(
      anadirNota({
        tipo,
        contenido: contenido.trim(),
        conCasilla: tipo === 'NOTA' ? conCasilla : undefined,
        tareaId: tareaId ?? undefined,
        objetivoId: objetivoId ?? undefined,
      }),
    );
    if (anadirNota.fulfilled.match(resultado)) setContenido('');
  }

  const etiqueta = intl.formatMessage({ id: tipo === 'NOTA' ? 'notas.nueva' : 'notas.todo.nuevo' });

  return (
    <Card>
      <CardContent>
        <form onSubmit={enviar} aria-label={etiqueta} className="flex flex-col gap-3">
          {tipo === 'NOTA' ? (
            <Textarea
              required
              maxLength={5000}
              value={contenido}
              onChange={(evento) => setContenido(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'notas.placeholder' })}
              aria-label={etiqueta}
            />
          ) : (
            <Input
              required
              maxLength={300}
              value={contenido}
              onChange={(evento) => setContenido(evento.target.value)}
              placeholder={intl.formatMessage({ id: 'notas.todo.placeholder' })}
              aria-label={etiqueta}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              {intl.formatMessage({ id: 'notas.asociarA' })}
              <select
                value={vinculo}
                onChange={(evento) => setVinculo(evento.target.value)}
                className={CLASE_SELECT}
              >
                <OpcionesVinculo />
              </select>
            </label>
            {tipo === 'NOTA' && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={conCasilla}
                  onCheckedChange={(valor) => setConCasilla(valor === true)}
                />
                {intl.formatMessage({ id: 'notas.conCasilla' })}
              </label>
            )}
            <Button type="submit" className="ml-auto">
              {intl.formatMessage({ id: 'notas.anadir' })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
