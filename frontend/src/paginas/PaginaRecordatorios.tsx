import {
  BellRing,
  CalendarClock,
  ClipboardCheck,
  MessageSquareReply,
  Siren,
  Sparkles,
  TreePalm,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  anadirDiaNoLectivo,
  anadirRecordatorio,
  cambiarEmergencia,
  cambiarRecordatorio,
  cargarAvisos,
  cargarCalendarioEscolar,
  cargarConfiguracionRecordatorios,
  comprobarAhora,
  leerAviso,
  leerTodosLosAvisos,
  quitarDiaNoLectivo,
  quitarRecordatorio,
} from '@/almacen/recordatoriosSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Aviso, Recordatorio, TipoAviso, TipoRecordatorio } from '@/servicios/recordatorios';
import { formatearDia, nombrePeriodo, textoAviso } from '@/utilidades/avisos';
import { reproducirAlarmaEmergencia, reproducirAvisoRecordatorio } from '@/utilidades/sonido';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

const ICONO_AVISO: Record<TipoAviso, typeof BellRing> = {
  REVISION_SEMANAL: ClipboardCheck,
  ENTREGA: CalendarClock,
  VACACIONES: TreePalm,
  EMERGENCIA: Siren,
  REVISION_SOLICITADA: UserCheck,
  REVISION_RESUELTA: MessageSquareReply,
};

// Lunes primero, como en el calendario escolar; el valor sigue siendo el de
// Date.getDay() (0 = domingo).
const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0];

function useNombreDia() {
  const intl = useIntl();
  // El 20/09/2026 fue domingo: sumándole el número de día sale ese día de la semana.
  return (dia: number) =>
    intl.formatDate(Date.UTC(2026, 8, 20 + dia), { weekday: 'long', timeZone: 'UTC' });
}

function estadoPermiso(): NotificationPermission | 'no-disponible' {
  return typeof Notification === 'undefined' ? 'no-disponible' : Notification.permission;
}

export function PaginaRecordatorios() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { avisos, configuracion, calendario, comprobando, error } = usarSelector(
    (estado) => estado.recordatorios,
  );
  const modoEscolar = usarSelector((estado) => estado.sesion.usuario?.modoEscolarActivo ?? false);
  const [permiso, setPermiso] = useState(estadoPermiso);
  const [resultadoComprobacion, setResultadoComprobacion] = useState<number | null>(null);

  useEffect(() => {
    despachar(cargarConfiguracionRecordatorios());
    despachar(cargarAvisos());
    despachar(cargarCalendarioEscolar());
  }, [despachar]);

  async function pedirPermiso() {
    setPermiso(await Notification.requestPermission());
  }

  async function comprobar() {
    setResultadoComprobacion(null);
    const resultado = await despachar(comprobarAhora());
    if (comprobarAhora.fulfilled.match(resultado)) setResultadoComprobacion(resultado.payload);
  }

  const sinLeer = avisos.filter((aviso) => !aviso.leidoEn).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'recordatorios.titulo' })}
        </h1>
        <Button variant="outline" onClick={comprobar} disabled={comprobando}>
          {intl.formatMessage({
            id: comprobando ? 'recordatorios.comprobando' : 'recordatorios.comprobarAhora',
          })}
        </Button>
      </div>

      {resultadoComprobacion != null && (
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage(
            { id: 'recordatorios.resultadoComprobacion' },
            { cantidad: resultadoComprobacion },
          )}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{intl.formatMessage({ id: 'recordatorios.avisos.titulo' })}</CardTitle>
            {sinLeer > 0 && (
              <Button variant="ghost" size="sm" onClick={() => despachar(leerTodosLosAvisos())}>
                {intl.formatMessage({ id: 'recordatorios.avisos.leerTodos' })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {avisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'recordatorios.avisos.vacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {avisos.slice(0, 30).map((aviso) => (
                <FilaAviso key={aviso.id} aviso={aviso} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'recordatorios.navegador.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'recordatorios.navegador.descripcion' })}
          </p>
          <p className="text-sm">
            {intl.formatMessage({ id: `recordatorios.navegador.permiso.${permiso}` })}
          </p>
          <div className="flex flex-wrap gap-2">
            {permiso === 'default' && (
              <Button onClick={pedirPermiso}>
                {intl.formatMessage({ id: 'recordatorios.navegador.activar' })}
              </Button>
            )}
            <Button variant="outline" onClick={reproducirAvisoRecordatorio}>
              {intl.formatMessage({ id: 'recordatorios.navegador.probarSonido' })}
            </Button>
            <Button variant="outline" onClick={reproducirAlarmaEmergencia}>
              {intl.formatMessage({ id: 'recordatorios.navegador.probarAlarma' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {configuracion && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{intl.formatMessage({ id: 'recordatorios.alarmas.titulo' })}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {configuracion.recordatorios.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: 'recordatorios.alarmas.vacio' })}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {configuracion.recordatorios.map((recordatorio) => (
                    <FilaRecordatorio
                      key={recordatorio.id}
                      recordatorio={recordatorio}
                      correoDisponible={configuracion.correoDisponible}
                    />
                  ))}
                </ul>
              )}
              <FormularioRecordatorio modoEscolar={modoEscolar} />
            </CardContent>
          </Card>

          <Card className={cn(configuracion.emergencia.activa && 'border-destructive/50')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Siren aria-hidden className="size-5 text-destructive" />
                {intl.formatMessage({ id: 'recordatorios.emergencia.titulo' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage(
                  { id: 'recordatorios.emergencia.descripcion' },
                  { dias: configuracion.emergencia.dias },
                )}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={configuracion.emergencia.activa}
                  onCheckedChange={(marcada) => despachar(cambiarEmergencia({ activa: marcada === true }))}
                />
                {intl.formatMessage({ id: 'recordatorios.emergencia.activar' })}
              </label>
              <label className="flex items-center gap-2 text-sm">
                {intl.formatMessage({ id: 'recordatorios.emergencia.dias' })}
                <Input
                  type="number"
                  min={1}
                  max={30}
                  className="w-20"
                  defaultValue={configuracion.emergencia.dias}
                  onBlur={(evento) => {
                    const dias = Number(evento.target.value);
                    if (dias >= 1 && dias <= 30 && dias !== configuracion.emergencia.dias) {
                      despachar(cambiarEmergencia({ dias }));
                    }
                  }}
                />
              </label>
              <CasillaCorreo
                marcada={configuracion.emergencia.porCorreo}
                correoDisponible={configuracion.correoDisponible}
                alCambiar={(porCorreo) => despachar(cambiarEmergencia({ porCorreo }))}
              />
            </CardContent>
          </Card>

          {configuracion.iaDisponible && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {intl.formatMessage({ id: 'recordatorios.ia.info' })}
            </p>
          )}
        </>
      )}

      {modoEscolar && calendario && <TarjetaCalendarioEscolar />}
    </main>
  );
}

function FilaAviso({ aviso }: { aviso: Aviso }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { titulo, cuerpo } = textoAviso(intl, aviso);
  const Icono = ICONO_AVISO[aviso.tipo];
  const esEmergencia = aviso.tipo === 'EMERGENCIA';

  return (
    <li
      className={cn(
        'flex gap-3 rounded-md border px-3 py-2',
        aviso.leidoEn ? 'border-border opacity-70' : 'border-primary/40 bg-primary/5',
        esEmergencia && !aviso.leidoEn && 'border-destructive/50 bg-destructive/5',
      )}
    >
      <Icono
        aria-hidden
        className={cn('mt-0.5 size-4 shrink-0', esEmergencia ? 'text-destructive' : 'text-primary')}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-sm text-muted-foreground">{cuerpo}</p>
        {aviso.mensajeIa && (
          <p className="flex items-start gap-1.5 text-sm italic">
            <Sparkles
              aria-label={intl.formatMessage({ id: 'recordatorios.ia.etiqueta' })}
              className="mt-0.5 size-3.5 shrink-0 text-motivador"
            />
            {aviso.mensajeIa}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {intl.formatDate(aviso.creadoEn, { dateStyle: 'medium', timeStyle: 'short' })}
          {aviso.correoEnviadoEn && ` · ${intl.formatMessage({ id: 'recordatorios.avisos.enviadoCorreo' })}`}
        </p>
      </div>
      {!aviso.leidoEn && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => despachar(leerAviso(aviso.id))}
        >
          {intl.formatMessage({ id: 'recordatorios.avisos.marcarLeido' })}
        </Button>
      )}
    </li>
  );
}

function CasillaCorreo({
  marcada,
  correoDisponible,
  alCambiar,
}: {
  marcada: boolean;
  correoDisponible: boolean;
  alCambiar: (marcada: boolean) => void;
}) {
  const intl = useIntl();
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={marcada} onCheckedChange={(valor) => alCambiar(valor === true)} />
        {intl.formatMessage({ id: 'recordatorios.porCorreo' })}
      </label>
      {marcada && !correoDisponible && (
        <p className="text-xs text-motivador">
          {intl.formatMessage({ id: 'recordatorios.correoNoConfigurado' })}
        </p>
      )}
    </div>
  );
}

function descripcionRecordatorio(
  intl: ReturnType<typeof useIntl>,
  nombreDia: (dia: number) => string,
  recordatorio: Recordatorio,
) {
  switch (recordatorio.tipo) {
    case 'REVISION_SEMANAL':
      return intl.formatMessage(
        { id: 'recordatorios.tipo.REVISION_SEMANAL.descripcion' },
        { dia: nombreDia(recordatorio.diaSemana ?? 1), hora: recordatorio.hora },
      );
    case 'ENTREGA':
      return intl.formatMessage(
        {
          id: recordatorio.soloEscolar
            ? 'recordatorios.tipo.ENTREGA.descripcionEscolar'
            : 'recordatorios.tipo.ENTREGA.descripcion',
        },
        { horas: recordatorio.horasAntes },
      );
    case 'VACACIONES':
      return intl.formatMessage(
        { id: 'recordatorios.tipo.VACACIONES.descripcion' },
        { dias: recordatorio.diasAntes },
      );
  }
}

function FilaRecordatorio({
  recordatorio,
  correoDisponible,
}: {
  recordatorio: Recordatorio;
  correoDisponible: boolean;
}) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const nombreDia = useNombreDia();
  const cambiar = (cambios: Partial<Recordatorio>) =>
    despachar(cambiarRecordatorio({ id: recordatorio.id, cambios }));

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium">
          {intl.formatMessage({ id: `recordatorios.tipo.${recordatorio.tipo}` })}
        </p>
        <p className="text-sm text-muted-foreground">
          {descripcionRecordatorio(intl, nombreDia, recordatorio)}
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={recordatorio.activo}
              onCheckedChange={(valor) => cambiar({ activo: valor === true })}
            />
            {intl.formatMessage({ id: 'recordatorios.activo' })}
          </label>
          <CasillaCorreo
            marcada={recordatorio.porCorreo}
            correoDisponible={correoDisponible}
            alCambiar={(porCorreo) => cambiar({ porCorreo })}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={intl.formatMessage({ id: 'recordatorios.eliminar' })}
        onClick={() => despachar(quitarRecordatorio(recordatorio.id))}
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  );
}

function FormularioRecordatorio({ modoEscolar }: { modoEscolar: boolean }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const nombreDia = useNombreDia();
  const [tipo, setTipo] = useState<TipoRecordatorio>('REVISION_SEMANAL');
  const [diaSemana, setDiaSemana] = useState(0);
  const [hora, setHora] = useState('18:00');
  const [horasAntes, setHorasAntes] = useState(24);
  const [diasAntes, setDiasAntes] = useState(3);
  const [soloEscolar, setSoloEscolar] = useState(false);
  const [porCorreo, setPorCorreo] = useState(false);

  const tipos: TipoRecordatorio[] = modoEscolar
    ? ['REVISION_SEMANAL', 'ENTREGA', 'VACACIONES']
    : ['REVISION_SEMANAL', 'ENTREGA'];

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    despachar(
      anadirRecordatorio(
        tipo === 'REVISION_SEMANAL'
          ? { tipo, diaSemana, hora, porCorreo }
          : tipo === 'ENTREGA'
            ? { tipo, horasAntes, soloEscolar: modoEscolar && soloEscolar, porCorreo }
            : { tipo, diasAntes, porCorreo },
      ),
    );
  }

  return (
    <form
      onSubmit={enviar}
      aria-label={intl.formatMessage({ id: 'recordatorios.nueva.titulo' })}
      className="flex flex-col gap-3 rounded-md border border-dashed border-border p-3"
    >
      <p className="text-sm font-medium">{intl.formatMessage({ id: 'recordatorios.nueva.titulo' })}</p>
      <label className="flex flex-col gap-1.5 text-sm">
        {intl.formatMessage({ id: 'recordatorios.nueva.tipo' })}
        <select
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value as TipoRecordatorio)}
          className={CLASE_SELECT}
        >
          {tipos.map((opcion) => (
            <option key={opcion} value={opcion}>
              {intl.formatMessage({ id: `recordatorios.tipo.${opcion}` })}
            </option>
          ))}
        </select>
      </label>

      {tipo === 'REVISION_SEMANAL' && (
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            {intl.formatMessage({ id: 'recordatorios.nueva.dia' })}
            <select
              value={diaSemana}
              onChange={(evento) => setDiaSemana(Number(evento.target.value))}
              className={CLASE_SELECT}
            >
              {DIAS_SEMANA.map((dia) => (
                <option key={dia} value={dia}>
                  {nombreDia(dia)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {intl.formatMessage({ id: 'recordatorios.nueva.hora' })}
            <Input type="time" required value={hora} onChange={(evento) => setHora(evento.target.value)} />
          </label>
        </div>
      )}

      {tipo === 'ENTREGA' && (
        <>
          <label className="flex items-center gap-2 text-sm">
            {intl.formatMessage({ id: 'recordatorios.nueva.horasAntes' })}
            <Input
              type="number"
              min={1}
              max={168}
              required
              className="w-24"
              value={horasAntes}
              onChange={(evento) => setHorasAntes(Number(evento.target.value))}
            />
          </label>
          {modoEscolar && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={soloEscolar} onCheckedChange={(valor) => setSoloEscolar(valor === true)} />
              {intl.formatMessage({ id: 'recordatorios.nueva.soloEscolar' })}
            </label>
          )}
        </>
      )}

      {tipo === 'VACACIONES' && (
        <label className="flex items-center gap-2 text-sm">
          {intl.formatMessage({ id: 'recordatorios.nueva.diasAntes' })}
          <Input
            type="number"
            min={0}
            max={30}
            required
            className="w-20"
            value={diasAntes}
            onChange={(evento) => setDiasAntes(Number(evento.target.value))}
          />
        </label>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={porCorreo} onCheckedChange={(valor) => setPorCorreo(valor === true)} />
        {intl.formatMessage({ id: 'recordatorios.porCorreo' })}
      </label>

      <Button type="submit" className="self-start">
        {intl.formatMessage({ id: 'recordatorios.nueva.anadir' })}
      </Button>
    </form>
  );
}

function TarjetaCalendarioEscolar() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const calendario = usarSelector((estado) => estado.recordatorios.calendario)!;
  const [nombre, setNombre] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const resultado = await despachar(anadirDiaNoLectivo({ nombre, inicio, fin: fin || inicio }));
    if (anadirDiaNoLectivo.fulfilled.match(resultado)) {
      setNombre('');
      setInicio('');
      setFin('');
    }
  }

  function rango(desde: string, hasta: string) {
    return desde === hasta
      ? formatearDia(intl, desde)
      : intl.formatMessage(
          { id: 'recordatorios.calendario.rango' },
          { inicio: formatearDia(intl, desde), fin: formatearDia(intl, hasta) },
        );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {intl.formatMessage({ id: 'recordatorios.calendario.titulo' }, { curso: calendario.curso })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {calendario.comunidad ? (
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'recordatorios.calendario.comunidad' },
              {
                comunidad: intl.formatMessage({ id: `comunidad.${calendario.comunidad}` }),
                inicio: formatearDia(intl, calendario.inicioClases!),
                fin: formatearDia(intl, calendario.finClases!),
              },
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'recordatorios.calendario.sinHorario' })}
          </p>
        )}

        {calendario.periodos.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {calendario.periodos.map((periodo) => (
              <li key={periodo.clave} className="flex flex-wrap justify-between gap-2">
                <span>{nombrePeriodo(intl, periodo)}</span>
                <span className="text-muted-foreground">{rango(periodo.inicio, periodo.fin)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {intl.formatMessage({ id: 'recordatorios.calendario.propios' })}
          </p>
          {calendario.propios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'recordatorios.calendario.propiosVacio' })}
            </p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {calendario.propios.map((propio) => (
                <li key={propio.id} className="flex items-center justify-between gap-2">
                  <span>{propio.nombre}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {rango(propio.inicio, propio.fin)}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={intl.formatMessage(
                        { id: 'recordatorios.calendario.eliminarPropio' },
                        { nombre: propio.nombre },
                      )}
                      onClick={() => despachar(quitarDiaNoLectivo(propio.id))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={enviar} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'recordatorios.calendario.nombre' })}
              <Input required maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'recordatorios.calendario.desde' })}
              <Input type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {intl.formatMessage({ id: 'recordatorios.calendario.hasta' })}
              <Input type="date" min={inicio} value={fin} onChange={(e) => setFin(e.target.value)} />
            </label>
            <Button type="submit" variant="outline">
              {intl.formatMessage({ id: 'recordatorios.calendario.anadir' })}
            </Button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground">
          {intl.formatMessage({ id: 'recordatorios.calendario.fuente' })}
        </p>
      </CardContent>
    </Card>
  );
}
