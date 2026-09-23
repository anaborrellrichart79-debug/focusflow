import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador } from '@/almacen/hooks';
import { reemplazarFranjas } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DatosFranja, Horario, TipoFranja } from '@/servicios/horarios';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

function sumarMinutos(hora: string, minutos: number) {
  const [h, m] = hora.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutos, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Borrador local de las franjas: se edita libremente (añadir clases o
// descansos, un segundo recreo, la comida de la jornada partida...) y solo
// se envía al pulsar "Guardar franjas", todo de una vez.
export function EditorFranjas({ horario }: { horario: Horario }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [borrador, setBorrador] = useState<DatosFranja[]>(() =>
    horario.franjas.map(({ id, horaInicio, horaFin, tipo, etiqueta }) => ({
      id,
      horaInicio,
      horaFin,
      tipo,
      etiqueta: etiqueta ?? '',
    })),
  );
  const [guardado, setGuardado] = useState(false);

  const errores = borrador.map((franja) => franja.horaInicio >= franja.horaFin);
  const hayErrores = errores.some(Boolean);

  function cambiar(indice: number, cambios: Partial<DatosFranja>) {
    setGuardado(false);
    setBorrador((actual) => actual.map((franja, i) => (i === indice ? { ...franja, ...cambios } : franja)));
  }

  function anadir(tipo: TipoFranja) {
    setGuardado(false);
    setBorrador((actual) => {
      const inicio = actual.at(-1)?.horaFin ?? '09:00';
      const duracion = tipo === 'CLASE' ? 60 : 30;
      const etiqueta = tipo === 'DESCANSO' ? intl.formatMessage({ id: 'horario.franjas.recreo' }) : '';
      return [...actual, { horaInicio: inicio, horaFin: sumarMinutos(inicio, duracion), tipo, etiqueta }];
    });
  }

  function mover(indice: number, delta: -1 | 1) {
    setGuardado(false);
    setBorrador((actual) => {
      const copia = [...actual];
      const [franja] = copia.splice(indice, 1);
      copia.splice(indice + delta, 0, franja);
      return copia;
    });
  }

  function quitar(indice: number) {
    setGuardado(false);
    setBorrador((actual) => actual.filter((_, i) => i !== indice));
  }

  async function guardar() {
    const resultado = await despachar(reemplazarFranjas({ id: horario.id, franjas: borrador }));
    if (reemplazarFranjas.fulfilled.match(resultado)) {
      // Las franjas nuevas ya tienen id: se recargan del servidor para que un
      // segundo guardado conserve sus celdas.
      setBorrador(
        resultado.payload.franjas.map(({ id, horaInicio, horaFin, tipo, etiqueta }) => ({
          id,
          horaInicio,
          horaFin,
          tipo,
          etiqueta: etiqueta ?? '',
        })),
      );
      setGuardado(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {intl.formatMessage({ id: 'horario.franjas.ayuda' })}
      </p>
      <ol className="flex flex-col gap-2">
        {borrador.map((franja, indice) => {
          const numero = indice + 1;
          return (
            <li
              key={franja.id ?? `nueva-${indice}`}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
            >
              <Input
                type="time"
                value={franja.horaInicio}
                onChange={(evento) => cambiar(indice, { horaInicio: evento.target.value })}
                aria-label={intl.formatMessage({ id: 'horario.franjas.inicio' }, { numero })}
                aria-invalid={errores[indice]}
                className="w-28"
              />
              <span aria-hidden>–</span>
              <Input
                type="time"
                value={franja.horaFin}
                onChange={(evento) => cambiar(indice, { horaFin: evento.target.value })}
                aria-label={intl.formatMessage({ id: 'horario.franjas.fin' }, { numero })}
                aria-invalid={errores[indice]}
                className="w-28"
              />
              <select
                value={franja.tipo}
                onChange={(evento) => cambiar(indice, { tipo: evento.target.value as TipoFranja })}
                aria-label={intl.formatMessage({ id: 'horario.franjas.tipo' }, { numero })}
                className={CLASE_SELECT}
              >
                <option value="CLASE">{intl.formatMessage({ id: 'horario.franjas.clase' })}</option>
                <option value="DESCANSO">{intl.formatMessage({ id: 'horario.descanso' })}</option>
              </select>
              {franja.tipo === 'DESCANSO' && (
                <Input
                  value={franja.etiqueta ?? ''}
                  onChange={(evento) => cambiar(indice, { etiqueta: evento.target.value })}
                  placeholder={intl.formatMessage({ id: 'horario.franjas.recreo' })}
                  aria-label={intl.formatMessage({ id: 'horario.franjas.etiqueta' }, { numero })}
                  maxLength={40}
                  className="w-32 flex-1"
                />
              )}
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={indice === 0}
                  onClick={() => mover(indice, -1)}
                  aria-label={intl.formatMessage({ id: 'horario.franjas.subir' }, { numero })}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={indice === borrador.length - 1}
                  onClick={() => mover(indice, 1)}
                  aria-label={intl.formatMessage({ id: 'horario.franjas.bajar' }, { numero })}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => quitar(indice)}
                  aria-label={intl.formatMessage({ id: 'horario.franjas.quitar' }, { numero })}
                >
                  ✕
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {hayErrores && (
        <p role="alert" className="text-sm text-destructive">
          {intl.formatMessage({ id: 'horario.franjas.error' })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => anadir('CLASE')}>
          {intl.formatMessage({ id: 'horario.franjas.anadirClase' })}
        </Button>
        <Button variant="outline" size="sm" onClick={() => anadir('DESCANSO')}>
          {intl.formatMessage({ id: 'horario.franjas.anadirDescanso' })}
        </Button>
        <Button size="sm" className="ml-auto" disabled={hayErrores} onClick={guardar}>
          {intl.formatMessage({ id: 'horario.franjas.guardar' })}
        </Button>
      </div>
      {guardado && (
        <p role="status" className="text-sm text-primary">
          {intl.formatMessage({ id: 'horario.guardado' })}
        </p>
      )}
    </div>
  );
}
