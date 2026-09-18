import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { alternarTema } from '@/almacen/interfazSlice';
import { Button } from '@/components/ui/button';

export function SelectorTema() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tema = usarSelector((estado) => estado.interfaz.tema);
  const esOscuro = tema === 'oscuro';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={intl.formatMessage({
        id: esOscuro ? 'tema.activarClaro' : 'tema.activarOscuro',
      })}
      aria-pressed={esOscuro}
      onClick={() => despachar(alternarTema())}
    >
      {esOscuro ? '☀️' : '🌙'}
    </Button>
  );
}
