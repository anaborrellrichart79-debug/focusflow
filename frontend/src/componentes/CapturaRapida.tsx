import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador } from '@/almacen/hooks';
import { crearTarea } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CapturaRapida() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [titulo, setTitulo] = useState('');

  function alCapturar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim()) return;
    despachar(crearTarea({ titulo }));
    setTitulo('');
  }

  return (
    <form
      onSubmit={alCapturar}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-background p-2 shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <Input
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder={intl.formatMessage({ id: 'captura.placeholder' })}
        aria-label={intl.formatMessage({ id: 'captura.placeholder' })}
        className="rounded-full border-none shadow-none"
      />
      <Button type="submit" size="sm" className="rounded-full">
        {intl.formatMessage({ id: 'captura.boton' })}
      </Button>
    </form>
  );
}
