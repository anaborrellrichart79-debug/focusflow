// Las fechas límite de las tareas se guardan como "hora de reloj" codificada en
// UTC: las 10:00 del usuario se guardan como 10:00Z, y una tarea sin hora como
// medianoche Z (ver combinarFechaYHora en el frontend). Para compararlas con el
// momento actual hay que pasar "ahora" a esa misma representación, usando la
// zona horaria del usuario (ZONA_HORARIA en .env, Europe/Madrid por defecto).

export interface HoraLocal {
  // "Ahora" como hora de reloj local codificada en UTC, comparable con fechaLimite.
  flotante: Date;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  diaSemana: number; // 0 = domingo ... 6 = sábado, igual que Date.getDay()
}

export function obtenerHoraLocal(ahora: Date, zonaHoraria: string): HoraLocal {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(ahora)
      .map((parte) => [parte.type, parte.value]),
  );
  const fecha = `${partes.year}-${partes.month}-${partes.day}`;
  const hora = `${partes.hour}:${partes.minute}`;
  const flotante = new Date(`${fecha}T${hora}:00.000Z`);
  return { flotante, fecha, hora, diaSemana: flotante.getUTCDay() };
}

// Una tarea sin hora vence al terminar su día, no a medianoche del principio.
export function vencimientoEfectivo(fechaLimite: Date): Date {
  const sinHora =
    fechaLimite.getUTCHours() === 0 &&
    fechaLimite.getUTCMinutes() === 0 &&
    fechaLimite.getUTCSeconds() === 0;
  return sinHora
    ? new Date(fechaLimite.getTime() + 24 * 60 * 60 * 1000 - 60 * 1000)
    : fechaLimite;
}
