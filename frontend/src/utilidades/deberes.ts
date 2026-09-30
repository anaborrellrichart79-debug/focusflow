import type { Horario } from '@/servicios/horarios';
import type { Tarea } from '@/servicios/tareas';

// Fecha de hoy (YYYY-MM-DD) en la hora del dispositivo: los deberes se
// piensan en días de calendario, no en horas.
export function fechaDeHoy(ahora: Date = new Date()): string {
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

export interface PeriodoSinClase {
  inicio: string; // YYYY-MM-DD
  fin: string;
}

// Hasta cuántos días por delante se busca la próxima clase (unas vacaciones
// de Navidad largas caben de sobra).
const DIAS_BUSQUEDA = 30;

// Cuándo hay que tener hechos unos deberes: la próxima clase de esa
// asignatura según el horario (después de hoy, de lunes a viernes y fuera de
// vacaciones y festivos). Sin asignatura, o si no aparece en el horario, el
// próximo día lectivo.
export function proximaClase(
  horario: Horario | null,
  asignaturaHorarioId: string | null,
  hoy: string,
  sinClase: PeriodoSinClase[] = [],
): string {
  const diasConClase = new Set(
    (horario?.sesiones ?? [])
      .filter((sesion) => sesion.asignaturaHorarioId === asignaturaHorarioId)
      .map((sesion) => sesion.diaSemana),
  );

  for (let desplazamiento = 1; desplazamiento <= DIAS_BUSQUEDA; desplazamiento++) {
    const fecha = sumarDias(hoy, desplazamiento);
    const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay(); // 0 = domingo
    if (diaSemana === 0 || diaSemana === 6) continue;
    if (sinClase.some((periodo) => periodo.inicio <= fecha && fecha <= periodo.fin)) continue;
    if (diasConClase.size === 0 || diasConClase.has(diaSemana)) return fecha;
  }
  return sumarDias(hoy, 1);
}

export interface DeberesAgrupados {
  atrasados: Tarea[];
  hoy: Tarea[];
  manana: Tarea[];
  masAdelante: Tarea[];
}

// Deberes pendientes por día de entrega. Los que no tienen fecha van con
// "más adelante" (al final).
export function agruparDeberes(tareas: Tarea[], hoy: string): DeberesAgrupados {
  const manana = sumarDias(hoy, 1);
  const grupos: DeberesAgrupados = { atrasados: [], hoy: [], manana: [], masAdelante: [] };

  const deberes = tareas
    .filter(
      (tarea) =>
        tarea.tipoEscolar === 'DEBERES' && tarea.estado !== 'HECHA' && tarea.estado !== 'ARCHIVADA',
    )
    .sort((a, b) => (a.fechaLimite ?? '9999').localeCompare(b.fechaLimite ?? '9999'));

  for (const tarea of deberes) {
    const fecha = tarea.fechaLimite?.slice(0, 10);
    if (!fecha) grupos.masAdelante.push(tarea);
    else if (fecha < hoy) grupos.atrasados.push(tarea);
    else if (fecha === hoy) grupos.hoy.push(tarea);
    else if (fecha === manana) grupos.manana.push(tarea);
    else grupos.masAdelante.push(tarea);
  }
  return grupos;
}
