import type { Tarea, TipoEscolar } from '@/servicios/tareas';
import { diasHastaFecha } from './fechas';

export const OPCIONES_TIPO_ESCOLAR: { valor: TipoEscolar; clave: string; icono: string }[] = [
  { valor: 'EXAMEN', clave: 'tipoEscolar.examen', icono: '📝' },
  { valor: 'TRABAJO', clave: 'tipoEscolar.trabajo', icono: '📚' },
  { valor: 'PRESENTACION', clave: 'tipoEscolar.presentacion', icono: '🎤' },
];

// Ventana de "esta semana" del planificador: hoy y los 7 días siguientes,
// igual que el widget "Próximos 7 días" de Inicio.
const DIAS_ESTA_SEMANA = 7;

export interface EntregasAgrupadas {
  vencidas: Tarea[];
  estaSemana: Tarea[];
  masAdelante: Tarea[];
  sinFecha: Tarea[];
}

// Una "entrega escolar" es una tarea escolar pendiente con tipo (examen,
// trabajo o presentación). Las tareas escolares sin tipo (p. ej. "repasar
// apuntes") siguen viéndose en Kanban/Agenda, pero no aquí.
export function agruparEntregasEscolares(
  tareas: Tarea[],
  tipo: TipoEscolar | 'TODOS' = 'TODOS',
): EntregasAgrupadas {
  const entregas = tareas
    .filter(
      (tarea) =>
        tarea.ambito === 'ESCOLAR' &&
        tarea.tipoEscolar !== null &&
        tarea.estado !== 'HECHA' &&
        (tipo === 'TODOS' || tarea.tipoEscolar === tipo),
    )
    .sort((a, b) => {
      if (!a.fechaLimite || !b.fechaLimite) return a.fechaLimite ? -1 : b.fechaLimite ? 1 : 0;
      return a.fechaLimite.localeCompare(b.fechaLimite);
    });

  const grupos: EntregasAgrupadas = { vencidas: [], estaSemana: [], masAdelante: [], sinFecha: [] };
  for (const tarea of entregas) {
    if (!tarea.fechaLimite) {
      grupos.sinFecha.push(tarea);
      continue;
    }
    const dias = diasHastaFecha(tarea.fechaLimite);
    if (dias < 0) grupos.vencidas.push(tarea);
    else if (dias <= DIAS_ESTA_SEMANA) grupos.estaSemana.push(tarea);
    else grupos.masAdelante.push(tarea);
  }
  return grupos;
}
