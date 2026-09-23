import { useEffect, useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  asignarTareaSupervisado,
  cargarFamilia,
  cargarTareasSupervisado,
  generarCodigoVinculo,
  quitarVinculo,
  revisarTareaSupervisado,
  vincularConCodigo,
} from '@/almacen/familiaSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import type { PersonaVinculada, TareaSupervisada } from '@/servicios/familia';
import type { Ambito } from '@/servicios/tareas';
import { ESTADOS_TAREA } from '@/utilidades/estados';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

function nombreDe(persona: PersonaVinculada) {
  return persona.nombre ?? persona.correo;
}

// Vínculo familiar: quien revisa las tareas de quién. El supervisado genera un
// código y el responsable lo introduce en su cuenta.
export function PaginaFamilia() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { datos, error } = usarSelector((estado) => estado.familia);

  useEffect(() => {
    despachar(cargarFamilia());
  }, [despachar]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'familia.titulo' })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'familia.descripcion' })}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {datos && (
        <>
          <TarjetaMisResponsables responsables={datos.responsables} codigo={datos.codigo} />
          <TarjetaVincular />
          {datos.supervisados.map((persona) => (
            <TarjetaSupervisado key={persona.vinculoId} persona={persona} />
          ))}
        </>
      )}
    </main>
  );
}

function TarjetaMisResponsables({
  responsables,
  codigo,
}: {
  responsables: PersonaVinculada[];
  codigo: { codigo: string; expiraEn: string } | null;
}) {
  const intl = useIntl();
  const despachar = usarDespachador();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{intl.formatMessage({ id: 'familia.responsables.titulo' })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {responsables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'familia.responsables.vacio' })}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {responsables.map((persona) => (
              <li
                key={persona.vinculoId}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {nombreDe(persona)}{' '}
                  <span className="text-muted-foreground">({persona.correo})</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => despachar(quitarVinculo(persona.vinculoId))}
                >
                  {intl.formatMessage({ id: 'familia.desvincular' })}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <p className="text-sm">{intl.formatMessage({ id: 'familia.codigo.explicacion' })}</p>
          {codigo && (
            <p className="flex flex-wrap items-baseline gap-3">
              <span
                className="font-mono text-2xl font-semibold tracking-[0.3em]"
                aria-label={intl.formatMessage({ id: 'familia.codigo.etiqueta' })}
              >
                {codigo.codigo}
              </span>
              <span className="text-xs text-muted-foreground">
                {intl.formatMessage(
                  { id: 'familia.codigo.caduca' },
                  { fecha: intl.formatDate(codigo.expiraEn, { dateStyle: 'medium', timeStyle: 'short' }) },
                )}
              </span>
            </p>
          )}
          <Button
            variant={codigo ? 'outline' : 'default'}
            className="self-start"
            onClick={() => despachar(generarCodigoVinculo())}
          >
            {intl.formatMessage({ id: codigo ? 'familia.codigo.otro' : 'familia.codigo.generar' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TarjetaVincular() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [codigo, setCodigo] = useState('');

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(vincularConCodigo(codigo));
    if (vincularConCodigo.fulfilled.match(resultado)) setCodigo('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{intl.formatMessage({ id: 'familia.vincular.titulo' })}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1.5 text-sm">
            {intl.formatMessage({ id: 'familia.vincular.codigo' })}
            <Input
              required
              minLength={6}
              maxLength={6}
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
              className="w-36 font-mono uppercase tracking-widest"
              autoComplete="off"
            />
          </label>
          <Button type="submit">{intl.formatMessage({ id: 'familia.vincular.boton' })}</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {intl.formatMessage({ id: 'familia.vincular.ayuda' })}
        </p>
      </CardContent>
    </Card>
  );
}

function TarjetaSupervisado({ persona }: { persona: PersonaVinculada }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareas = usarSelector((estado) => estado.familia.tareasPorSupervisado[persona.id]);

  useEffect(() => {
    despachar(cargarTareasSupervisado(persona.id));
  }, [despachar, persona.id]);

  const pendientes = (tareas ?? []).filter((tarea) => tarea.estadoRevision === 'PENDIENTE');
  const resto = (tareas ?? []).filter((tarea) => tarea.estadoRevision !== 'PENDIENTE');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            {intl.formatMessage({ id: 'familia.supervisado.titulo' }, { nombre: nombreDe(persona) })}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => despachar(quitarVinculo(persona.vinculoId))}>
            {intl.formatMessage({ id: 'familia.desvincular' })}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {intl.formatMessage({ id: 'familia.supervisado.pendientes' }, { cantidad: pendientes.length })}
          </h3>
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'familia.supervisado.pendientesVacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pendientes.map((tarea) => (
                <FilaRevision key={tarea.id} tarea={tarea} supervisadoId={persona.id} />
              ))}
            </ul>
          )}
        </section>

        {resto.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">
              {intl.formatMessage({ id: 'familia.supervisado.resto' })}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {resto.map((tarea) => (
                <FilaTareaSupervisada key={tarea.id} tarea={tarea} />
              ))}
            </ul>
          </section>
        )}

        <FormularioAsignar supervisadoId={persona.id} />
      </CardContent>
    </Card>
  );
}

function FilaTareaSupervisada({ tarea }: { tarea: TareaSupervisada }) {
  const intl = useIntl();
  const estado = ESTADOS_TAREA.find((opcion) => opcion.estado === tarea.estado);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="min-w-0">
        {tarea.titulo}
        {tarea.estadoRevision && (
          <span className="ml-2 text-xs text-muted-foreground">
            · {intl.formatMessage({ id: `revision.insignia.${tarea.estadoRevision}` })}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: estado?.color }}
          />
          {estado && intl.formatMessage({ id: estado.clave })}
        </span>
      </span>
    </li>
  );
}

function FilaRevision({ tarea, supervisadoId }: { tarea: TareaSupervisada; supervisadoId: string }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [devolviendo, setDevolviendo] = useState(false);
  const [comentario, setComentario] = useState('');
  const completadas = tarea.subtareas.filter((subtarea) => subtarea.completada).length;

  function revisar(decision: 'APROBADA' | 'DEVUELTA') {
    despachar(
      revisarTareaSupervisado({
        supervisadoId,
        tareaId: tarea.id,
        decision,
        comentario: decision === 'DEVUELTA' ? comentario : undefined,
      }),
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{tarea.titulo}</p>
        {tarea.fechaLimite && <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />}
      </div>
      {tarea.descripcion && <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>}
      {tarea.subtareas.length > 0 && (
        <p className="text-xs text-muted-foreground">
          ☑ {completadas}/{tarea.subtareas.length}
        </p>
      )}
      {devolviendo ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            revisar('DEVUELTA');
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            {intl.formatMessage({ id: 'familia.revision.comentario' })}
            <Textarea
              required
              maxLength={500}
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive">
              {intl.formatMessage({ id: 'familia.revision.enviarDevolucion' })}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDevolviendo(false)}>
              {intl.formatMessage({ id: 'familia.revision.cancelar' })}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => revisar('APROBADA')}>
            {intl.formatMessage({ id: 'familia.revision.aprobar' })}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDevolviendo(true)}>
            {intl.formatMessage({ id: 'familia.revision.devolver' })}
          </Button>
        </div>
      )}
    </li>
  );
}

function FormularioAsignar({ supervisadoId }: { supervisadoId: string }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [ambito, setAmbito] = useState<Ambito>('ESCOLAR');

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(
      asignarTareaSupervisado({
        supervisadoId,
        datos: {
          titulo,
          ambito,
          // Día sin hora, igual que en el resto de formularios (ver combinarFechaYHora).
          fechaLimite: fecha ? `${fecha}T00:00:00.000Z` : undefined,
        },
      }),
    );
    if (asignarTareaSupervisado.fulfilled.match(resultado)) {
      setTitulo('');
      setFecha('');
    }
  }

  return (
    <form
      onSubmit={enviar}
      aria-label={intl.formatMessage({ id: 'familia.asignar.titulo' })}
      className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3"
    >
      <p className="text-sm font-medium">{intl.formatMessage({ id: 'familia.asignar.titulo' })}</p>
      <Input
        required
        maxLength={150}
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder={intl.formatMessage({ id: 'tareas.tituloPlaceholder' })}
        aria-label={intl.formatMessage({ id: 'familia.asignar.tarea' })}
      />
      <div className="flex flex-wrap items-end gap-2">
        <Input
          type="date"
          value={fecha}
          onChange={(evento) => setFecha(evento.target.value)}
          aria-label={intl.formatMessage({ id: 'fechaLimite.etiqueta' })}
          className="w-auto"
        />
        <select
          value={ambito}
          onChange={(evento) => setAmbito(evento.target.value as Ambito)}
          aria-label={intl.formatMessage({ id: 'tarea.detalle.ambito' })}
          className={CLASE_SELECT}
        >
          <option value="ESCOLAR">{intl.formatMessage({ id: 'ambito.escolar' })}</option>
          <option value="PERSONAL">{intl.formatMessage({ id: 'ambito.personal' })}</option>
          <option value="EVENTUAL">{intl.formatMessage({ id: 'ambito.eventual' })}</option>
        </select>
        <Button type="submit">{intl.formatMessage({ id: 'familia.asignar.boton' })}</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {intl.formatMessage({ id: 'familia.asignar.ayuda' })}
      </p>
    </form>
  );
}
