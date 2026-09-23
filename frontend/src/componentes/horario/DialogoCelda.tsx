import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador } from '@/almacen/hooks';
import { asignarSesion } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { FranjaHorario, Horario } from '@/servicios/horarios';
import { cn } from '@/lib/utils';
import { colorTextoSobre } from '@/utilidades/colores';
import { claveCelda, indexarCeldas, nombreDia } from '@/utilidades/horario';

interface Props {
  horario: Horario;
  franja: FranjaHorario;
  diaSemana: number;
  alCerrar: () => void;
}

export function DialogoCelda({ horario, franja, diaSemana, alCerrar }: Props) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const celdaActual = indexarCeldas(horario).get(claveCelda(franja.id, diaSemana));
  const [asignaturaHorarioId, setAsignaturaHorarioId] = useState<string | null>(
    celdaActual?.asignatura.id ?? null,
  );
  const [aula, setAula] = useState(celdaActual?.sesion.aula ?? '');

  async function guardar(idElegido: string | null) {
    await despachar(
      asignarSesion({
        id: horario.id,
        franjaId: franja.id,
        diaSemana,
        asignaturaHorarioId: idElegido,
        aula: idElegido ? aula : undefined,
      }),
    );
    alCerrar();
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {nombreDia(diaSemana, intl.locale)} · {franja.horaInicio} – {franja.horaFin}
          </DialogTitle>
        </DialogHeader>

        {horario.asignaturas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'horario.celda.sinAsignaturas' })}
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label={intl.formatMessage({ id: 'horario.celda.elegir' })}
            className="grid grid-cols-2 gap-2"
          >
            {horario.asignaturas.map((elegida) => {
              const seleccionada = elegida.id === asignaturaHorarioId;
              return (
                <button
                  key={elegida.id}
                  type="button"
                  role="radio"
                  aria-checked={seleccionada}
                  onClick={() => setAsignaturaHorarioId(elegida.id)}
                  className={cn(
                    'rounded-md px-2 py-2 text-left text-sm font-medium transition-shadow',
                    seleccionada ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : 'opacity-85',
                  )}
                  style={{ backgroundColor: elegida.color, color: colorTextoSobre(elegida.color) }}
                >
                  {elegida.asignatura.nombre}
                </button>
              );
            })}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.celda.aula' })}
          <Input value={aula} onChange={(evento) => setAula(evento.target.value)} maxLength={30} />
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          {celdaActual && (
            <Button variant="outline" onClick={() => guardar(null)}>
              {intl.formatMessage({ id: 'horario.celda.vaciar' })}
            </Button>
          )}
          <Button disabled={!asignaturaHorarioId} onClick={() => guardar(asignaturaHorarioId)}>
            {intl.formatMessage({ id: 'horario.guardar' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
