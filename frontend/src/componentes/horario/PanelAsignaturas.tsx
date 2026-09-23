import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  anadirAsignaturaHorario,
  cambiarColorAsignaturaHorario,
  quitarAsignaturaHorario,
} from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  crearOptativaPropia,
  listarAsignaturasCurso,
  type Asignatura,
  type AsignaturaHorario,
  type Horario,
} from '@/servicios/horarios';
import { ORDEN_CATEGORIAS } from '@/utilidades/horario';

const CLASE_SELECT =
  'min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Selector de color de una asignatura. El cambio se guarda un momento después
// de dejar de moverlo: el selector nativo dispara un evento por cada tono
// intermedio y no queremos una petición por cada uno.
function SelectorColor({ horarioId, elegida }: { horarioId: string; elegida: AsignaturaHorario }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [color, setColor] = useState(elegida.color);

  useEffect(() => {
    if (color.toLowerCase() === elegida.color.toLowerCase()) return;
    const temporizador = setTimeout(() => {
      despachar(
        cambiarColorAsignaturaHorario({ id: horarioId, asignaturaHorarioId: elegida.id, color }),
      );
    }, 400);
    return () => clearTimeout(temporizador);
  }, [color, elegida.color, elegida.id, horarioId, despachar]);

  return (
    <input
      type="color"
      value={color}
      onChange={(evento) => setColor(evento.target.value)}
      aria-label={intl.formatMessage(
        { id: 'horario.asignaturas.color' },
        { asignatura: elegida.asignatura.nombre },
      )}
      className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
    />
  );
}

export function PanelAsignaturas({ horario }: { horario: Horario }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [catalogo, setCatalogo] = useState<Asignatura[]>([]);
  const [elegidaParaAnadir, setElegidaParaAnadir] = useState('');
  const [nombreOptativa, setNombreOptativa] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    listarAsignaturasCurso(token, horario.cursoId, horario.comunidad)
      .then((asignaturas) => vigente && setCatalogo(asignaturas))
      .catch(() => vigente && setCatalogo([]));
    return () => {
      vigente = false;
    };
  }, [token, horario.cursoId, horario.comunidad]);

  // El catálogo agrupado por categoría (y por modalidad en Bachillerato), sin
  // las asignaturas que ya están en el horario.
  const grupos = useMemo(() => {
    const yaElegidas = new Set(horario.asignaturas.map((elegida) => elegida.asignaturaId));
    const disponibles = catalogo.filter((asignatura) => !yaElegidas.has(asignatura.id));
    const porGrupo = new Map<string, Asignatura[]>();
    for (const categoria of ORDEN_CATEGORIAS) {
      for (const asignatura of disponibles.filter((candidata) => candidata.categoria === categoria)) {
        const categoriaVisible = asignatura.usuarioId ? 'PROPIA' : categoria;
        const etiqueta =
          intl.formatMessage({ id: `horario.categoria.${categoriaVisible}` }) +
          (asignatura.modalidad ? ` · ${asignatura.modalidad}` : '');
        porGrupo.set(etiqueta, [...(porGrupo.get(etiqueta) ?? []), asignatura]);
      }
    }
    return [...porGrupo.entries()];
  }, [catalogo, horario.asignaturas, intl]);

  async function anadir(asignaturaId: string) {
    setError(null);
    const resultado = await despachar(anadirAsignaturaHorario({ id: horario.id, asignaturaId }));
    if (anadirAsignaturaHorario.rejected.match(resultado)) setError(resultado.payload ?? null);
    setElegidaParaAnadir('');
  }

  async function anadirOptativaPropia(evento: React.FormEvent) {
    evento.preventDefault();
    if (!token || !nombreOptativa.trim()) return;
    setError(null);
    try {
      const nueva = await crearOptativaPropia(token, {
        nombre: nombreOptativa,
        cursoId: horario.cursoId,
      });
      setCatalogo((actual) => [...actual, nueva]);
      setNombreOptativa('');
      await anadir(nueva.id);
    } catch {
      setError(intl.formatMessage({ id: 'horario.asignaturas.errorOptativa' }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {horario.asignaturas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'horario.asignaturas.vacio' })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {horario.asignaturas.map((elegida) => (
            <li key={elegida.id} className="flex items-center gap-2">
              <SelectorColor horarioId={horario.id} elegida={elegida} />
              <span className="min-w-0 flex-1 truncate text-sm">{elegida.asignatura.nombre}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={intl.formatMessage(
                  { id: 'horario.asignaturas.quitar' },
                  { asignatura: elegida.asignatura.nombre },
                )}
                onClick={() =>
                  despachar(
                    quitarAsignaturaHorario({ id: horario.id, asignaturaHorarioId: elegida.id }),
                  )
                }
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <select
          value={elegidaParaAnadir}
          onChange={(evento) => setElegidaParaAnadir(evento.target.value)}
          aria-label={intl.formatMessage({ id: 'horario.asignaturas.catalogo' })}
          className={CLASE_SELECT}
        >
          <option value="">{intl.formatMessage({ id: 'horario.asignaturas.catalogo' })}</option>
          {grupos.map(([etiqueta, asignaturas]) => (
            <optgroup key={etiqueta} label={etiqueta}>
              {asignaturas.map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Button size="sm" disabled={!elegidaParaAnadir} onClick={() => anadir(elegidaParaAnadir)}>
          {intl.formatMessage({ id: 'horario.asignaturas.anadir' })}
        </Button>
      </div>

      <form onSubmit={anadirOptativaPropia} className="flex gap-2">
        <Input
          value={nombreOptativa}
          onChange={(evento) => setNombreOptativa(evento.target.value)}
          placeholder={intl.formatMessage({ id: 'horario.asignaturas.optativaPropia' })}
          aria-label={intl.formatMessage({ id: 'horario.asignaturas.optativaPropia' })}
          maxLength={80}
        />
        <Button type="submit" size="sm" variant="outline" disabled={!nombreOptativa.trim()}>
          {intl.formatMessage({ id: 'horario.asignaturas.anadir' })}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
