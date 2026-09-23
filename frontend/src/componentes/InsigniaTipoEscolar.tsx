import { useIntl } from 'react-intl';
import { Badge } from '@/components/ui/badge';
import type { TipoEscolar } from '@/servicios/tareas';
import { OPCIONES_TIPO_ESCOLAR } from '@/utilidades/planificador';

export function InsigniaTipoEscolar({ tipo }: { tipo: TipoEscolar }) {
  const intl = useIntl();
  const opcion = OPCIONES_TIPO_ESCOLAR.find((opcion) => opcion.valor === tipo)!;

  return (
    <Badge variant="secondary">
      <span aria-hidden>{opcion.icono}</span>
      {intl.formatMessage({ id: opcion.clave })}
    </Badge>
  );
}
