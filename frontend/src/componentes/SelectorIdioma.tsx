import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarIdioma } from '@/almacen/interfazSlice';
import { IDIOMAS_DISPONIBLES, type CodigoIdioma } from '@/idiomas';

export function SelectorIdioma() {
  const despachar = usarDespachador();
  const idiomaActual = usarSelector((estado) => estado.interfaz.idioma);

  return (
    <select
      aria-label="Idioma"
      value={idiomaActual}
      onChange={(evento) =>
        despachar(cambiarIdioma(evento.target.value as CodigoIdioma))
      }
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
    >
      {IDIOMAS_DISPONIBLES.map((idioma) => (
        <option key={idioma.codigo} value={idioma.codigo}>
          {idioma.etiqueta}
        </option>
      ))}
    </select>
  );
}
