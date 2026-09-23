import { useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { anadirNota } from '@/almacen/notasSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilaNota } from './FilaNota';

// Notas y to-dos asociados a una tarea (en su detalle): se ven, se marcan y
// se añaden to-dos rápidos; para escribir notas largas, el enlace a Notas.
export function NotasVinculadas({ tareaId }: { tareaId: string }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const notas = usarSelector((estado) => estado.notas.lista).filter(
    (nota) => nota.tareaId === tareaId,
  );
  const [todo, setTodo] = useState('');

  async function anadirTodo(evento: FormEvent) {
    evento.preventDefault();
    if (!todo.trim()) return;
    const resultado = await despachar(
      anadirNota({ tipo: 'TODO', contenido: todo.trim(), tareaId }),
    );
    if (anadirNota.fulfilled.match(resultado)) setTodo('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {intl.formatMessage({ id: 'tarea.detalle.notas' }, { cantidad: notas.length })}
        </span>
        <Link
          to={`/notas?tarea=${tareaId}`}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          {intl.formatMessage({ id: 'tarea.detalle.abrirNotas' })}
        </Link>
      </div>
      {notas.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {notas.map((nota) => (
            <FilaNota key={nota.id} nota={nota} compacta />
          ))}
        </ul>
      )}
      <form onSubmit={anadirTodo} className="flex gap-2">
        <Input
          value={todo}
          maxLength={300}
          onChange={(evento) => setTodo(evento.target.value)}
          placeholder={intl.formatMessage({ id: 'tarea.detalle.nuevoTodo' })}
          aria-label={intl.formatMessage({ id: 'tarea.detalle.nuevoTodo' })}
        />
        <Button type="submit" size="sm">
          {intl.formatMessage({ id: 'tareas.anadir' })}
        </Button>
      </form>
    </div>
  );
}
