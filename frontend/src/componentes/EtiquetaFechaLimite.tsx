import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { CODIGO_LOCALE_ICU } from '@/idiomas';
import { diasHastaFecha, formatearFechaRelativa } from '@/utilidades/fechas';

export function EtiquetaFechaLimite({ fechaLimite }: { fechaLimite: string }) {
  const intl = useIntl();
  const idioma = usarSelector((estado) => estado.interfaz.idioma);
  const dias = diasHastaFecha(fechaLimite);
  const texto = formatearFechaRelativa(fechaLimite, CODIGO_LOCALE_ICU[idioma]);

  const color = dias < 0 ? 'var(--destructive)' : dias <= 2 ? 'var(--motivador)' : undefined;

  return (
    <span
      className="w-fit rounded-full border px-2 py-0.5 text-xs font-medium"
      style={
        color
          ? { color, borderColor: 'color-mix(in oklch, ' + color + ' 40%, transparent)' }
          : undefined
      }
      title={intl.formatDate(fechaLimite, { dateStyle: 'medium' })}
    >
      📅 {texto}
    </span>
  );
}
