import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { EnlacesLegales } from '@/componentes/EnlacesLegales';
import { SelectorIdioma } from '@/componentes/SelectorIdioma';
import { FECHA_TEXTOS_LEGALES, TEXTOS_LEGALES, type Bloque } from '@/legal';

// Página pública (sin sesión) con la política de privacidad o las condiciones
// del servicio, en el idioma elegido. La versión en castellano es la de
// referencia: en los demás idiomas se avisa arriba.
export function PaginaLegal({ documento }: { documento: 'privacidad' | 'condiciones' }) {
  const intl = useIntl();
  const idioma = usarSelector((estado) => estado.interfaz.idioma);
  const texto = TEXTOS_LEGALES[idioma][documento];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-xl font-semibold tracking-tight text-transparent"
        >
          {intl.formatMessage({ id: 'app.titulo' })}
        </Link>
        <SelectorIdioma />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{texto.titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage(
            { id: 'legal.actualizado' },
            { fecha: intl.formatDate(`${FECHA_TEXTOS_LEGALES}T00:00:00.000Z`, { dateStyle: 'long', timeZone: 'UTC' }) },
          )}
        </p>
        {idioma !== 'es' && (
          <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'legal.discrepancia' })}</p>
        )}
      </div>

      {texto.secciones.map((seccion) => (
        <section key={seccion.titulo} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
          {seccion.bloques.map((bloque, indice) => (
            <BloqueLegal key={indice} bloque={bloque} />
          ))}
        </section>
      ))}

      <EnlacesLegales className="justify-start border-t border-border pt-4" />
      <Link to="/" className="text-sm text-primary hover:underline">
        {intl.formatMessage({ id: 'legal.volver' })}
      </Link>
    </main>
  );
}

function BloqueLegal({ bloque }: { bloque: Bloque }) {
  if (typeof bloque === 'string') {
    return <p className="text-sm leading-relaxed">{bloque}</p>;
  }
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
      {bloque.lista.map((punto) => (
        <li key={punto}>{punto}</li>
      ))}
    </ul>
  );
}
