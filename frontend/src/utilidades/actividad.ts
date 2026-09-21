function claveDia(fecha: Date) {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
}

export interface DiaActividad {
  fecha: Date;
  cantidad: number;
}

function construirMapaActividad(fechasIso: string[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const iso of fechasIso) {
    const clave = claveDia(new Date(iso));
    mapa.set(clave, (mapa.get(clave) ?? 0) + 1);
  }
  return mapa;
}

// Cuadrícula estilo GitHub: cada elemento del array exterior es una semana
// (columna), con sus 7 días de lunes a domingo. La semana actual es la
// última columna; se retrocede "semanas" columnas completas desde ahí.
export function construirSemanasActividad(fechasIso: string[], semanas = 14): DiaActividad[][] {
  const mapa = construirMapaActividad(fechasIso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - diasDesdeLunes - (semanas - 1) * 7);

  const columnas: DiaActividad[][] = [];
  for (let semana = 0; semana < semanas; semana += 1) {
    const dias: DiaActividad[] = [];
    for (let dia = 0; dia < 7; dia += 1) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() + semana * 7 + dia);
      dias.push({ fecha, cantidad: mapa.get(claveDia(fecha)) ?? 0 });
    }
    columnas.push(dias);
  }
  return columnas;
}
