import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { guardarPomodoro } from '@/almacen/sesionSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  configEfectiva,
  LIMITES_POMODORO,
  limitarCampo,
  presetDe,
  presetPorEdad,
  PRESETS_POMODORO,
  type ConfigPomodoro,
} from '@/utilidades/pomodoro';

const CAMPOS: (keyof ConfigPomodoro)[] = ['trabajo', 'descansoCorto', 'descansoLargo', 'ciclos'];

// Duraciones del Pomodoro de la cuenta: una opción por edad (la de la suya,
// marcada como recomendada) o los minutos a mano. Se guarda en la cuenta,
// así es igual en el ordenador y en la tablet.
export function AjustesPomodoro() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const actual = configEfectiva(usuario?.pomodoro, usuario?.edad);
  const recomendado = presetPorEdad(usuario?.edad);
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<ConfigPomodoro>(actual);
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo');

  async function guardar(config: ConfigPomodoro | null) {
    setEstado('guardando');
    const resultado = await despachar(guardarPomodoro(config));
    if (guardarPomodoro.fulfilled.match(resultado)) {
      setBorrador(configEfectiva(resultado.payload.pomodoro, resultado.payload.edad));
      setEstado('guardado');
    } else {
      setEstado('error');
    }
  }

  const presetMarcado = presetDe(borrador);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden className="size-4 text-primary" />
            {intl.formatMessage({ id: 'pomodoro.ajustes.titulo' })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={abierto}
            onClick={() => {
              setBorrador(actual);
              setEstado('inactivo');
              setAbierto((valor) => !valor);
            }}
          >
            {intl.formatMessage({ id: abierto ? 'pomodoro.ajustes.cerrar' : 'pomodoro.ajustes.cambiar' })}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          {intl.formatMessage(
            { id: 'pomodoro.ajustes.actual' },
            { trabajo: actual.trabajo, corto: actual.descansoCorto, largo: actual.descansoLargo, ciclos: actual.ciclos },
          )}
        </p>

        {abierto && (
          <>
            <p className="text-muted-foreground">{intl.formatMessage({ id: 'pomodoro.ajustes.ayuda' })}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRESETS_POMODORO.map(({ clave, config }) => (
                <button
                  key={clave}
                  type="button"
                  aria-pressed={presetMarcado === clave}
                  onClick={() => setBorrador(config)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted',
                    presetMarcado === clave ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {intl.formatMessage({ id: `pomodoro.preset.${clave}` })}
                    {clave === recomendado && (
                      <Badge variant="secondary">{intl.formatMessage({ id: 'pomodoro.preset.recomendado' })}</Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {intl.formatMessage(
                      { id: 'pomodoro.preset.resumen' },
                      { trabajo: config.trabajo, descanso: config.descansoCorto },
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CAMPOS.map((campo) => (
                <label key={campo} className="flex flex-col gap-1">
                  {intl.formatMessage({ id: `pomodoro.campo.${campo}` })}
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={LIMITES_POMODORO[campo].min}
                    max={LIMITES_POMODORO[campo].max}
                    value={borrador[campo]}
                    onChange={(evento) => setBorrador({ ...borrador, [campo]: Number(evento.target.value) })}
                    onBlur={() => setBorrador({ ...borrador, [campo]: limitarCampo(campo, borrador[campo]) })}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  guardar({
                    trabajo: limitarCampo('trabajo', borrador.trabajo),
                    descansoCorto: limitarCampo('descansoCorto', borrador.descansoCorto),
                    descansoLargo: limitarCampo('descansoLargo', borrador.descansoLargo),
                    ciclos: limitarCampo('ciclos', borrador.ciclos),
                  })
                }
                disabled={estado === 'guardando'}
              >
                {intl.formatMessage({ id: 'pomodoro.ajustes.guardar' })}
              </Button>
              {usuario?.pomodoro && (
                <Button variant="ghost" onClick={() => guardar(null)} disabled={estado === 'guardando'}>
                  {intl.formatMessage({ id: 'pomodoro.ajustes.porEdad' })}
                </Button>
              )}
            </div>
            {estado === 'guardado' && (
              <p role="status" className="text-primary">
                {intl.formatMessage({ id: 'pomodoro.ajustes.guardado' })}
              </p>
            )}
            {estado === 'error' && (
              <p role="alert" className="text-destructive">
                {intl.formatMessage({ id: 'pomodoro.ajustes.error' })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
