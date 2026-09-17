import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  CICLOS_PARA_DESCANSO_LARGO,
  iniciar,
  notificacionMostrada,
  pausar,
  reiniciarFase,
  tick,
} from '@/almacen/pomodoroSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { reproducirAvisoFasePomodoro } from '@/utilidades/sonido';

const ETIQUETAS_FASE: Record<string, string> = {
  trabajo: 'pomodoro.fase.trabajo',
  descansoCorto: 'pomodoro.fase.descansoCorto',
  descansoLargo: 'pomodoro.fase.descansoLargo',
};

function formatearTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos.toString().padStart(2, '0')}:${resto.toString().padStart(2, '0')}`;
}

export function PaginaPomodoro() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { fase, segundosRestantes, activo, ciclosCompletados, notificacionPendiente } =
    usarSelector((estado) => estado.pomodoro);

  useEffect(() => {
    if (!activo) return;
    const identificador = setInterval(() => despachar(tick()), 1000);
    return () => clearInterval(identificador);
  }, [activo, despachar]);

  useEffect(() => {
    if (!notificacionPendiente) return;
    reproducirAvisoFasePomodoro();
    despachar(notificacionMostrada());
  }, [notificacionPendiente, despachar]);

  const cicloActual = (ciclosCompletados % CICLOS_PARA_DESCANSO_LARGO) + 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex w-full justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
        </Button>
      </div>

      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {intl.formatMessage({ id: ETIQUETAS_FASE[fase] })}
          </span>
          <span className="text-6xl font-semibold tabular-nums tracking-tight">
            {formatearTiempo(segundosRestantes)}
          </span>
          <span className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'pomodoro.ciclo' },
              { actual: cicloActual, total: CICLOS_PARA_DESCANSO_LARGO },
            )}
          </span>

          <div className="mt-4 flex gap-3">
            {activo ? (
              <Button onClick={() => despachar(pausar())}>
                {intl.formatMessage({ id: 'pomodoro.pausar' })}
              </Button>
            ) : (
              <Button onClick={() => despachar(iniciar())}>
                {intl.formatMessage({ id: 'pomodoro.iniciar' })}
              </Button>
            )}
            <Button variant="outline" onClick={() => despachar(reiniciarFase())}>
              {intl.formatMessage({ id: 'pomodoro.reiniciar' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
