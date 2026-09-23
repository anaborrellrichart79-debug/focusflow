import { useEffect, useMemo, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { cargarTareasSupervisado } from '@/almacen/familiaSlice';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarNotas } from '@/almacen/notasSlice';
import { cargarHistorialPomodoro } from '@/almacen/pomodoroSlice';
import { seleccionarTareasDelAmbito } from '@/almacen/selectores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UsuarioSesion } from '@/servicios/autenticacion';
import type { PersonaVinculada } from '@/servicios/familia';
import { clasesDelDia } from '@/utilidades/agenda';
import { formatearDia, nombrePeriodo, periodosDelCalendario } from '@/utilidades/avisos';
import { diasHastaFecha } from '@/utilidades/fechas';
import { perfilesEfectivos } from '@/utilidades/perfiles';
import { agruparEntregasEscolares } from '@/utilidades/planificador';
import { EtiquetaFechaLimite } from './EtiquetaFechaLimite';
import { FilaNota } from './FilaNota';
import { InsigniaTipoEscolar } from './InsigniaTipoEscolar';

const MAXIMO_ELEMENTOS = 5;

function Tarjeta({
  titulo,
  enlace,
  children,
}: {
  titulo: string;
  enlace?: { a: string; texto: string };
  children: ReactNode;
}) {
  return (
    <Card className="text-left">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            {titulo}
          </CardTitle>
          {enlace && (
            <Link to={enlace.a} className="text-xs text-primary underline-offset-2 hover:underline">
              {enlace.texto}
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Vacio({ id }: { id: string }) {
  const intl = useIntl();
  return <p className="text-sm text-muted-foreground">{intl.formatMessage({ id })}</p>;
}

// Hoy como fecha de reloj en UTC, igual que en la Agenda.
function hoyFlotante() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
}

// Inicio con sesión: tarjetas comunes (próximos 7 días, to-dos) y otras según
// los perfiles (Estudiante, Profesional, Padre) elegidos en Ajustes o, si no
// hay ninguno elegido, los que sugiere la app.
export function InicioPersonalizado({ usuario }: { usuario: UsuarioSesion }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const supervisados = usarSelector((estado) => estado.familia.datos?.supervisados ?? []);
  const { perfiles, sugeridos } = perfilesEfectivos(usuario, supervisados.length);

  useEffect(() => {
    despachar(cargarNotas());
    despachar(cargarHistorialPomodoro());
  }, [despachar]);

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {intl.formatMessage(
          { id: sugeridos ? 'inicio.perfiles.sugeridos' : 'inicio.perfiles.elegidos' },
          {
            perfiles: intl.formatList(perfiles.map((p) => intl.formatMessage({ id: `perfil.${p}` }))),
            enlace: (texto: ReactNode) => (
              <Link to="/ajustes" className="text-primary underline-offset-2 hover:underline">
                {texto}
              </Link>
            ),
          },
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {perfiles.includes('PADRE') && <TarjetaRevisiones supervisados={supervisados} />}
        {perfiles.includes('ESTUDIANTE') && (
          <>
            <TarjetaClasesDeHoy />
            <TarjetaEntregas />
            <TarjetaVacaciones />
          </>
        )}
        {perfiles.includes('PROFESIONAL') && (
          <>
            <TarjetaPrioridades />
            <TarjetaPomodorosHoy />
          </>
        )}
        <TarjetaProximos />
        <TarjetaTodos />
      </div>
    </div>
  );
}

function TarjetaProximos() {
  const intl = useIntl();
  const tareas = usarSelector(seleccionarTareasDelAmbito);
  const proximas = useMemo(
    () =>
      tareas
        .filter((tarea) => tarea.estado !== 'HECHA' && tarea.fechaLimite)
        .filter((tarea) => {
          const dias = diasHastaFecha(tarea.fechaLimite!);
          return dias >= 0 && dias <= 7;
        })
        .sort((a, b) => diasHastaFecha(a.fechaLimite!) - diasHastaFecha(b.fechaLimite!)),
    [tareas],
  );

  return (
    <Tarjeta titulo={intl.formatMessage({ id: 'inicio.proximos.titulo' })}>
      {proximas.length === 0 ? (
        <Vacio id="inicio.proximos.vacio" />
      ) : (
        <ul className="flex flex-col gap-2">
          {proximas.map((tarea) => (
            <li key={tarea.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{tarea.titulo}</span>
              <span className="shrink-0">
                <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite!} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function TarjetaTodos() {
  const intl = useIntl();
  const pendientes = usarSelector((estado) => estado.notas.lista).filter(
    (nota) => nota.tipo === 'TODO' && !nota.completada,
  );

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.todos.titulo' })}
      enlace={{ a: '/notas?pestana=todo', texto: intl.formatMessage({ id: 'inicio.verTodo' }) }}
    >
      {pendientes.length === 0 ? (
        <Vacio id="inicio.todos.vacio" />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pendientes.slice(0, MAXIMO_ELEMENTOS).map((nota) => (
            <FilaNota key={nota.id} nota={nota} compacta />
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function TarjetaClasesDeHoy() {
  const intl = useIntl();
  const horario = usarSelector((estado) => estado.horario.activo);
  const modoEscolar = usarSelector((estado) => estado.sesion.usuario?.modoEscolarActivo ?? false);
  const calendario = usarSelector((estado) => estado.recordatorios.calendario);
  const clases = clasesDelDia(horario, hoyFlotante(), calendario);

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.clases.titulo' })}
      enlace={{ a: '/agenda', texto: intl.formatMessage({ id: 'inicio.verAgenda' }) }}
    >
      {clases.length === 0 ? (
        <Vacio
          id={
            !modoEscolar
              ? 'inicio.clases.sinModoEscolar'
              : horario
                ? 'inicio.clases.vacio'
                : 'inicio.clases.sinHorario'
          }
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {clases.map((clase) => (
            <li key={clase.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: clase.color }} />
              <span className="tabular-nums text-muted-foreground">{clase.horaInicio}</span>
              {clase.nombre}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function TarjetaEntregas() {
  const intl = useIntl();
  const tareas = usarSelector(seleccionarTareasDelAmbito);
  const { vencidas, estaSemana, masAdelante } = agruparEntregasEscolares(tareas);
  const entregas = [...vencidas, ...estaSemana, ...masAdelante].slice(0, MAXIMO_ELEMENTOS);

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.entregas.titulo' })}
      enlace={{ a: '/planificador', texto: intl.formatMessage({ id: 'inicio.verTodo' }) }}
    >
      {entregas.length === 0 ? (
        <Vacio id="inicio.entregas.vacio" />
      ) : (
        <ul className="flex flex-col gap-2">
          {entregas.map((tarea) => (
            <li key={tarea.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                {tarea.tipoEscolar && <InsigniaTipoEscolar tipo={tarea.tipoEscolar} />}
                {tarea.titulo}
              </span>
              {tarea.fechaLimite && (
                <span className="shrink-0">
                  <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function TarjetaVacaciones() {
  const intl = useIntl();
  const calendario = usarSelector((estado) => estado.recordatorios.calendario);
  const hoy = hoyFlotante().toISOString().slice(0, 10);
  const siguiente = periodosDelCalendario(calendario)
    .filter((periodo) => periodo.fin >= hoy)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  return (
    <Tarjeta titulo={intl.formatMessage({ id: 'inicio.vacaciones.titulo' })}>
      {!siguiente ? (
        <Vacio id="inicio.vacaciones.vacio" />
      ) : (
        <p className="text-sm">
          <span className="font-medium">{nombrePeriodo(intl, siguiente)}</span>
          <span className="block text-muted-foreground">
            {siguiente.inicio === siguiente.fin
              ? formatearDia(intl, siguiente.inicio)
              : intl.formatMessage(
                  { id: 'recordatorios.calendario.rango' },
                  { inicio: formatearDia(intl, siguiente.inicio), fin: formatearDia(intl, siguiente.fin) },
                )}
          </span>
        </p>
      )}
    </Tarjeta>
  );
}

function TarjetaPrioridades() {
  const intl = useIntl();
  const tareas = usarSelector(seleccionarTareasDelAmbito);
  // Lo urgente e importante (Eisenhower) y lo de alto impacto (Pareto).
  const prioridades = tareas
    .filter(
      (tarea) =>
        tarea.estado !== 'HECHA' &&
        ((tarea.urgente && tarea.importante) || tarea.esAltoImpacto),
    )
    .slice(0, MAXIMO_ELEMENTOS);

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.prioridades.titulo' })}
      enlace={{ a: '/eisenhower', texto: intl.formatMessage({ id: 'inicio.verTodo' }) }}
    >
      {prioridades.length === 0 ? (
        <Vacio id="inicio.prioridades.vacio" />
      ) : (
        <ul className="flex flex-col gap-2">
          {prioridades.map((tarea) => (
            <li key={tarea.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {tarea.esAltoImpacto && <span className="mr-1 text-motivador">★</span>}
                {tarea.titulo}
              </span>
              {tarea.fechaLimite && (
                <span className="shrink-0">
                  <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function TarjetaPomodorosHoy() {
  const intl = useIntl();
  const historial = usarSelector((estado) => estado.pomodoro.historial);
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const hoy = historial.filter(
    (sesion) => sesion.fase === 'TRABAJO' && new Date(sesion.completadaEn) >= inicioHoy,
  ).length;

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.pomodoros.titulo' })}
      enlace={{ a: '/pomodoro', texto: intl.formatMessage({ id: 'inicio.pomodoros.empezar' }) }}
    >
      <p className="text-3xl font-semibold tabular-nums">{hoy}</p>
      <p className="text-sm text-muted-foreground">
        {intl.formatMessage({ id: 'inicio.pomodoros.hoy' }, { cantidad: hoy })}
      </p>
    </Tarjeta>
  );
}

function TarjetaRevisiones({ supervisados }: { supervisados: PersonaVinculada[] }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tareasPorSupervisado = usarSelector((estado) => estado.familia.tareasPorSupervisado);
  const ids = supervisados.map((persona) => persona.id).join(',');

  useEffect(() => {
    for (const id of ids.split(',').filter(Boolean)) despachar(cargarTareasSupervisado(id));
  }, [despachar, ids]);

  return (
    <Tarjeta
      titulo={intl.formatMessage({ id: 'inicio.revisiones.titulo' })}
      enlace={{ a: '/familia', texto: intl.formatMessage({ id: 'inicio.verTodo' }) }}
    >
      {supervisados.length === 0 ? (
        <Vacio id="inicio.revisiones.sinVinculo" />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {supervisados.map((persona) => {
            const pendientes = (tareasPorSupervisado[persona.id] ?? []).filter(
              (tarea) => tarea.estadoRevision === 'PENDIENTE',
            ).length;
            return (
              <li key={persona.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{persona.nombre ?? persona.correo}</span>
                <span className={pendientes > 0 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                  {intl.formatMessage({ id: 'inicio.revisiones.pendientes' }, { cantidad: pendientes })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
