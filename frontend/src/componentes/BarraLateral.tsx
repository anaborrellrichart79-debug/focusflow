import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  UsersRound,
  Columns3,
  GraduationCap,
  Grid2x2,
  House,
  LogOut,
  Settings,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { Link, NavLink } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cerrarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SelectorAmbito } from './SelectorAmbito';
import { SelectorIdioma } from './SelectorIdioma';
import { SelectorTema } from './SelectorTema';

interface EnlaceNavegacion {
  ruta: string;
  clave: string;
  icono: LucideIcon;
  soloModoEscolar?: boolean;
}

const SECCIONES: { clave: string; enlaces: EnlaceNavegacion[] }[] = [
  {
    clave: 'nav.seccion.planificar',
    enlaces: [
      { ruta: '/', clave: 'nav.inicio', icono: House },
      { ruta: '/objetivos', clave: 'nav.objetivos', icono: Target },
      { ruta: '/agenda', clave: 'nav.agenda', icono: CalendarDays },
      { ruta: '/kanban', clave: 'nav.kanban', icono: Columns3 },
      { ruta: '/eisenhower', clave: 'nav.eisenhower', icono: Grid2x2 },
      {
        ruta: '/horario',
        clave: 'nav.horario',
        icono: CalendarClock,
        soloModoEscolar: true,
      },
      {
        ruta: '/planificador',
        clave: 'nav.planificador',
        icono: GraduationCap,
        soloModoEscolar: true,
      },
    ],
  },
  {
    clave: 'nav.seccion.concentrarse',
    enlaces: [{ ruta: '/pomodoro', clave: 'nav.pomodoro', icono: Timer }],
  },
  {
    clave: 'nav.seccion.revisar',
    enlaces: [
      { ruta: '/revision', clave: 'nav.revision', icono: ClipboardCheck },
      { ruta: '/recordatorios', clave: 'nav.recordatorios', icono: BellRing },
      { ruta: '/familia', clave: 'nav.familia', icono: UsersRound },
      { ruta: '/estadisticas', clave: 'nav.estadisticas', icono: ChartColumn },
    ],
  },
];

function claseEnlace({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
    isActive
      ? 'bg-primary/10 font-medium text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );
}

// `alNavegar` permite al cajón del móvil cerrarse al elegir una sección.
export function BarraLateral({ alNavegar }: { alNavegar?: () => void }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const modoEscolar = usuario?.modoEscolarActivo ?? false;
  const avisosSinLeer = usarSelector(
    (estado) => estado.recordatorios.avisos.filter((aviso) => !aviso.leidoEn).length,
  );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link
        to="/"
        onClick={alNavegar}
        className="bg-gradient-to-br from-primary to-motivador bg-clip-text px-3 text-2xl font-semibold tracking-tight text-transparent"
      >
        {intl.formatMessage({ id: 'app.titulo' })}
      </Link>

      <SelectorAmbito />

      <nav aria-label={intl.formatMessage({ id: 'nav.principal' })} className="flex flex-col gap-4">
        {SECCIONES.map((seccion) => (
          <div key={seccion.clave} className="flex flex-col gap-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {intl.formatMessage({ id: seccion.clave })}
            </p>
            {seccion.enlaces
              .filter((enlace) => modoEscolar || !enlace.soloModoEscolar)
              .map(({ ruta, clave, icono: Icono }) => (
                <NavLink key={ruta} to={ruta} end onClick={alNavegar} className={claseEnlace}>
                  <Icono aria-hidden className="size-4" />
                  {intl.formatMessage({ id: clave })}
                  {ruta === '/recordatorios' && avisosSinLeer > 0 && (
                    <span
                      className="ml-auto rounded-full bg-destructive px-1.5 text-xs font-medium text-white"
                      aria-label={intl.formatMessage(
                        { id: 'nav.avisosSinLeer' },
                        { cantidad: avisosSinLeer },
                      )}
                    >
                      {avisosSinLeer}
                    </span>
                  )}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <NavLink to="/ajustes" end onClick={alNavegar} className={claseEnlace}>
          <Settings aria-hidden className="size-4" />
          {intl.formatMessage({ id: 'nav.ajustes' })}
        </NavLink>
        <div className="flex items-center gap-2 px-3">
          <SelectorTema />
          <SelectorIdioma />
        </div>
        {usuario && (
          <p className="truncate px-3 text-xs text-muted-foreground" title={usuario.correo}>
            {usuario.nombre ?? usuario.correo}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-3 px-3 text-muted-foreground"
          onClick={() => despachar(cerrarSesion())}
        >
          <LogOut aria-hidden className="size-4" />
          {intl.formatMessage({ id: 'auth.cerrarSesion' })}
        </Button>
      </div>
    </div>
  );
}
