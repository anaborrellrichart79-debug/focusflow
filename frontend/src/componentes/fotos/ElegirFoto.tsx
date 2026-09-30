import { Camera } from 'lucide-react';
import { useRef } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@/components/ui/button';

// Botón que abre la cámara o la galería (en el móvil, "image/*" deja elegir
// entre las dos) y devuelve la foto elegida.
export function ElegirFoto({
  texto,
  deshabilitado,
  alElegir,
}: {
  texto: string;
  deshabilitado?: boolean;
  alElegir: (foto: File) => void;
}) {
  const intl = useIntl();
  const entrada = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button variant="outline" size="sm" disabled={deshabilitado} onClick={() => entrada.current?.click()}>
        <Camera aria-hidden className="size-4" />
        {texto}
      </Button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={intl.formatMessage({ id: 'fotos.elegir' })}
        tabIndex={-1}
        onChange={(evento) => {
          const foto = evento.target.files?.[0];
          // Vaciar la selección permite volver a elegir la misma foto.
          evento.target.value = '';
          if (foto) alElegir(foto);
        }}
      />
    </>
  );
}
