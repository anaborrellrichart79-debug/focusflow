import { Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  anadirEtiqueta,
  cambiarEtiqueta,
  cargarEtiquetas,
  quitarEtiqueta,
} from '@/almacen/etiquetasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Etiqueta } from '@/servicios/etiquetas';
import {
  MAXIMO_NIVELES_ETIQUETA,
  aplanarArbol,
  padresPosibles,
  rutaEtiqueta,
} from '@/utilidades/etiquetas';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-shadow hover:shadow-md';

function OpcionesPadre({ etiquetas, id }: { etiquetas: Etiqueta[]; id?: string }) {
  const intl = useIntl();
  return (
    <>
      <option value="">{intl.formatMessage({ id: 'etiquetas.primerNivel' })}</option>
      {padresPosibles(etiquetas, id).map(({ etiqueta }) => (
        <option key={etiqueta.id} value={etiqueta.id}>
          {rutaEtiqueta(etiquetas, etiqueta.id)}
        </option>
      ))}
    </>
  );
}

// Árbol de etiquetas de hasta 3 niveles (Estudio › Matemáticas › Cálculo):
// crear, renombrar, mover dentro de otra y eliminar.
export function PaginaEtiquetas() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { lista: etiquetas, error } = usarSelector((estado) => estado.etiquetas);
  const [nombre, setNombre] = useState('');
  const [padreId, setPadreId] = useState('');

  useEffect(() => {
    despachar(cargarEtiquetas());
  }, [despachar]);

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(
      anadirEtiqueta({ nombre: nombre.trim(), padreId: padreId || undefined }),
    );
    if (anadirEtiqueta.fulfilled.match(resultado)) setNombre('');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'etiquetas.titulo' })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage(
            { id: 'etiquetas.descripcion' },
            { niveles: MAXIMO_NIVELES_ETIQUETA },
          )}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'etiquetas.nueva' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={crear}
            aria-label={intl.formatMessage({ id: 'etiquetas.nueva' })}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'etiquetas.nombre' })}
              <Input
                required
                maxLength={40}
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'etiquetas.dentroDe' })}
              <select
                value={padreId}
                onChange={(evento) => setPadreId(evento.target.value)}
                className={CLASE_SELECT}
              >
                <OpcionesPadre etiquetas={etiquetas} />
              </select>
            </label>
            <Button type="submit">{intl.formatMessage({ id: 'etiquetas.crear' })}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'etiquetas.tuyas' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {etiquetas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'etiquetas.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5" aria-label={intl.formatMessage({ id: 'etiquetas.tuyas' })}>
              {aplanarArbol(etiquetas).map(({ etiqueta, nivel }) => (
                <FilaEtiqueta
                  key={etiqueta.id}
                  etiqueta={etiqueta}
                  nivel={nivel}
                  etiquetas={etiquetas}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function FilaEtiqueta({
  etiqueta,
  nivel,
  etiquetas,
}: {
  etiqueta: Etiqueta;
  nivel: number;
  etiquetas: Etiqueta[];
}) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [nombre, setNombre] = useState(etiqueta.nombre);

  function guardarNombre() {
    const limpio = nombre.trim();
    if (limpio && limpio !== etiqueta.nombre) {
      despachar(cambiarEtiqueta({ id: etiqueta.id, nombre: limpio }));
    } else {
      setNombre(etiqueta.nombre);
    }
  }

  return (
    <li
      className="flex flex-wrap items-center gap-2 border-l-2 border-border py-0.5 pl-2"
      style={{ marginLeft: `${(nivel - 1) * 1.25}rem` }}
    >
      <Input
        value={nombre}
        maxLength={40}
        onChange={(evento) => setNombre(evento.target.value)}
        onBlur={guardarNombre}
        aria-label={intl.formatMessage({ id: 'etiquetas.renombrar' }, { nombre: etiqueta.nombre })}
        className="h-8 w-40 flex-1"
      />
      <select
        value={etiqueta.padreId ?? ''}
        onChange={(evento) =>
          despachar(cambiarEtiqueta({ id: etiqueta.id, padreId: evento.target.value || null }))
        }
        aria-label={intl.formatMessage({ id: 'etiquetas.mover' }, { nombre: etiqueta.nombre })}
        className={CLASE_SELECT}
      >
        <OpcionesPadre etiquetas={etiquetas} id={etiqueta.id} />
      </select>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={intl.formatMessage({ id: 'etiquetas.eliminar' }, { nombre: etiqueta.nombre })}
        onClick={() => despachar(quitarEtiqueta(etiqueta.id))}
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  );
}
