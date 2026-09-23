import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { seleccionarAmbitoActivo } from '@/almacen/selectores';
import { cambiarAmbitoActivo, type AmbitoActivo } from '@/almacen/interfazSlice';
import { Button } from '@/components/ui/button';

const OPCIONES_AMBITO: { valor: AmbitoActivo; clave: string }[] = [
  { valor: 'TODOS', clave: 'ambito.todos' },
  { valor: 'PERSONAL', clave: 'ambito.personal' },
  { valor: 'ESCOLAR', clave: 'ambito.escolar' },
  { valor: 'EVENTUAL', clave: 'ambito.eventual' },
];

export function SelectorAmbito() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const ambitoActivo = usarSelector(seleccionarAmbitoActivo);
  // "Escolar" solo con el modo escolar activado (Ajustes).
  const modoEscolar = usarSelector((estado) => estado.sesion.usuario?.modoEscolarActivo ?? false);

  return (
    <div
      role="group"
      aria-label={intl.formatMessage({ id: 'ambito.selector' })}
      className="flex w-full rounded-full border border-border bg-background p-0.5 shadow-sm"
    >
      {OPCIONES_AMBITO.filter((opcion) => modoEscolar || opcion.valor !== 'ESCOLAR').map((opcion) => (
        <Button
          key={opcion.valor}
          type="button"
          size="sm"
          variant={ambitoActivo === opcion.valor ? 'default' : 'ghost'}
          aria-pressed={ambitoActivo === opcion.valor}
          onClick={() => despachar(cambiarAmbitoActivo(opcion.valor))}
          className="h-7 min-w-0 flex-1 rounded-full px-1 text-xs"
        >
          {intl.formatMessage({ id: opcion.clave })}
        </Button>
      ))}
    </div>
  );
}
