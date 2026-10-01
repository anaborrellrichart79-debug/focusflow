import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { usarSelector } from '@/almacen/hooks';
import { idAncla, TEMAS_AYUDA, TEXTOS_AYUDA } from '@/ayuda';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContenidoAyuda } from '@/componentes/ContenidoAyuda';

// Guía de uso: todos los temas, con un índice arriba. /ayuda#ayuda-<tema>
// (lo que enlaza la ventana del botón «?») baja directamente a ese tema.
export function PaginaAyuda() {
  const intl = useIntl();
  const { hash } = useLocation();
  const idioma = usarSelector((estado) => estado.interfaz.idioma);
  const textos = TEXTOS_AYUDA[idioma];

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{intl.formatMessage({ id: 'ayuda.titulo' })}</h1>
        <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'ayuda.intro' })}</p>
      </div>

      <nav aria-label={intl.formatMessage({ id: 'ayuda.indice' })}>
        <ul className="flex flex-wrap gap-2">
          {TEMAS_AYUDA.map(({ id }) => (
            <li key={id}>
              <a
                href={`#${idAncla(id)}`}
                className="inline-block rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                {textos.temas[id].titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {TEMAS_AYUDA.map(({ id, soloModoEscolar }) => (
        <Card key={id} id={idAncla(id)} className="scroll-mt-4">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <h2>{textos.temas[id].titulo}</h2>
              {soloModoEscolar && (
                <Badge variant="secondary">{intl.formatMessage({ id: 'ajustes.modoEscolar.titulo' })}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContenidoAyuda tema={id} />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
