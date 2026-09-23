import { colorTextoSobre } from '@/utilidades/colores';

// Nombre de la asignatura de una tarea escolar con el mismo color que tiene
// en el horario de clase.
export function InsigniaAsignatura({ nombre, color }: { nombre: string; color: string }) {
  return (
    <span
      className="inline-flex h-5 w-fit max-w-full shrink-0 items-center truncate rounded-4xl px-2 text-xs font-medium"
      style={{ backgroundColor: color, color: colorTextoSobre(color) }}
    >
      {nombre}
    </span>
  );
}
