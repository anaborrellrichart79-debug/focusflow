import { Lightbulb } from 'lucide-react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { ARCHIVO_VIDEO, portadaDe, TEMAS_AYUDA, TEXTOS_AYUDA, type IdTemaAyuda } from '@/ayuda';

// Un tema de la ayuda: resumen, pasos, consejo y sus vídeos. Lo usan la página
// Ayuda y la ventana del botón «?».
export function ContenidoAyuda({ tema }: { tema: IdTemaAyuda }) {
  const intl = useIntl();
  const idioma = usarSelector((estado) => estado.interfaz.idioma);
  const textos = TEXTOS_AYUDA[idioma];
  const { resumen, pasos, consejo } = textos.temas[tema];
  const videos = TEMAS_AYUDA.find((config) => config.id === tema)?.videos ?? [];

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">{resumen}</p>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ul>
      {consejo && (
        <p className="flex gap-2 rounded-lg bg-muted px-3 py-2">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{consejo}</span>
        </p>
      )}
      {videos.map((video) => (
        <figure key={video} className="flex flex-col gap-1.5">
          {/* preload="metadata": solo baja el vídeo entero si se reproduce. La
              portada es un fotograma del final: el principio de cada grabación
              es la página todavía en blanco. */}
          <video
            src={ARCHIVO_VIDEO[video]}
            poster={portadaDe(video)}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={textos.videos[video]}
            className="w-full rounded-lg border border-border bg-muted"
          />
          <figcaption className="text-xs text-muted-foreground">{textos.videos[video]}</figcaption>
        </figure>
      ))}
      {videos.length > 0 && (
        <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'ayuda.notaVideos' })}</p>
      )}
    </div>
  );
}
