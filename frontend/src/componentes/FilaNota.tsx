import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador } from '@/almacen/hooks';
import { cambiarNota, quitarNota } from '@/almacen/notasSlice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Nota } from '@/servicios/notas';

// Una nota o un to-do. "compacta" (en el detalle de una tarea): solo el texto
// y la casilla, sin edición ni vínculo.
export function FilaNota({ nota, compacta = false }: { nota: Nota; compacta?: boolean }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [contenido, setContenido] = useState(nota.contenido);

  function guardarContenido() {
    const limpio = contenido.trim();
    if (limpio && limpio !== nota.contenido) {
      despachar(cambiarNota({ id: nota.id, cambios: { contenido: limpio } }));
    } else {
      setContenido(nota.contenido);
    }
  }

  const vinculo = nota.tarea ?? nota.objetivo;

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2',
        nota.completada && 'opacity-60',
      )}
    >
      {nota.conCasilla && (
        <Checkbox
          className="mt-1"
          checked={nota.completada}
          aria-label={intl.formatMessage({ id: 'notas.marcar' }, { contenido: nota.contenido })}
          onCheckedChange={(valor) =>
            despachar(cambiarNota({ id: nota.id, cambios: { completada: valor === true } }))
          }
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {nota.tipo === 'NOTA' && !compacta ? (
          <Textarea
            value={contenido}
            onChange={(evento) => setContenido(evento.target.value)}
            onBlur={guardarContenido}
            aria-label={intl.formatMessage({ id: 'notas.editar' })}
            className={cn('min-h-10 border-none px-0 shadow-none', nota.completada && 'line-through')}
          />
        ) : (
          <p className={cn('text-sm whitespace-pre-wrap', nota.completada && 'line-through')}>
            {nota.contenido}
          </p>
        )}
        {!compacta && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {vinculo && (
              <span className="rounded-full bg-muted px-2 py-0.5">
                {intl.formatMessage(
                  { id: nota.tarea ? 'notas.vinculo.tarea' : 'notas.vinculo.objetivo' },
                  { titulo: vinculo.titulo },
                )}
              </span>
            )}
            {nota.tipo === 'NOTA' && (
              <button
                type="button"
                className="underline-offset-2 hover:underline"
                onClick={() =>
                  despachar(cambiarNota({ id: nota.id, cambios: { conCasilla: !nota.conCasilla } }))
                }
              >
                {intl.formatMessage({ id: nota.conCasilla ? 'notas.quitarCasilla' : 'notas.ponerCasilla' })}
              </button>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={intl.formatMessage({ id: 'notas.eliminar' })}
        onClick={() => despachar(quitarNota(nota.id))}
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  );
}
