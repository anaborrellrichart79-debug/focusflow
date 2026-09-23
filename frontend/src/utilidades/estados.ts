import type { EstadoTarea } from '@/servicios/tareas';

// Orden de las columnas del Kanban y de la barra de Estadísticas. Cada estado
// conserva siempre su color (el de una tarea no cambia al filtrar).
export const ESTADOS_TAREA: { estado: EstadoTarea; clave: string; color: string }[] = [
  { estado: 'POR_HACER', clave: 'kanban.columna.porHacer', color: 'var(--chart-1)' },
  { estado: 'EN_PROCESO', clave: 'kanban.columna.enProceso', color: 'var(--chart-2)' },
  { estado: 'BAJO_CONTROL', clave: 'kanban.columna.bajoControl', color: 'var(--chart-4)' },
  { estado: 'POSPUESTA', clave: 'kanban.columna.pospuesta', color: 'var(--chart-5)' },
  { estado: 'HECHA', clave: 'kanban.columna.hecha', color: 'var(--chart-3)' },
  // Fuera de Estadísticas (las archivadas no cuentan en ninguna vista salvo el
  // Kanban), así que no necesita un color de la paleta: gris neutro.
  { estado: 'ARCHIVADA', clave: 'kanban.columna.archivada', color: 'var(--muted-foreground)' },
];

export const ESTADOS_SIN_ARCHIVADA = ESTADOS_TAREA.filter((columna) => columna.estado !== 'ARCHIVADA');
