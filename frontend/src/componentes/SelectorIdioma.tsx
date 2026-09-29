import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cambiarIdioma } from '@/almacen/interfazSlice';
import { sincronizarIdioma } from '@/almacen/sesionSlice';
import { IDIOMAS_DISPONIBLES, type CodigoIdioma } from '@/idiomas';

export function SelectorIdioma() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const idiomaActual = usarSelector((estado) => estado.interfaz.idioma);
  const conSesion = usarSelector((estado) => Boolean(estado.sesion.tokenAcceso));

  // Con sesión iniciada, también se guarda en la cuenta: es el idioma de lo
  // que redacta el servidor (avisos push, correos, texto de la IA).
  function alCambiar(idioma: CodigoIdioma) {
    despachar(cambiarIdioma(idioma));
    if (conSesion) despachar(sincronizarIdioma(idioma));
  }

  return (
    <select
      aria-label={intl.formatMessage({ id: 'selector.idioma.etiqueta' })}
      value={idiomaActual}
      onChange={(evento) => alCambiar(evento.target.value as CodigoIdioma)}
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
