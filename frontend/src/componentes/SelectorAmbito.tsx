import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarAmbitoActivo, type AmbitoActivo } from '@/almacen/interfazSlice';
import { Button } from '@/components/ui/button';

const OPCIONES_AMBITO: { valor: AmbitoActivo; clave: string }[] = [
  { valor: 'TODOS', clave: 'ambito.todos' },
  { valor: 'PERSONAL', clave: 'ambito.personal' },
  { valor: 'ESCOLAR', clave: 'ambito.escolar' },
];

export function SelectorAmbito() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const ambitoActivo = usarSelector((estado) => estado.interfaz.ambitoActivo);

  return (
    <div
      role="group"
      aria-label={intl.formatMessage({ id: 'ambito.selector' })}
      className="inline-flex rounded-full border border-border bg-background p-0.5 shadow-sm"
    >
      {OPCIONES_AMBITO.map((opcion) => (
        <Button
          key={opcion.valor}
          type="button"
          size="sm"
          variant={ambitoActivo === opcion.valor ? 'default' : 'ghost'}
          aria-pressed={ambitoActivo === opcion.valor}
          onClick={() => despachar(cambiarAmbitoActivo(opcion.valor))}
          className="h-7 rounded-full px-3"
        >
          {intl.formatMessage({ id: opcion.clave })}
        </Button>
      ))}
    </div>
  );
}
