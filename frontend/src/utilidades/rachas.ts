function claveDia(fecha: Date) {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
}

// Cuenta los días consecutivos con actividad, terminando hoy o ayer: si hoy
// todavía no hay actividad no se considera rota la racha hasta que acabe el
// día (igual que apps de hábitos tipo Duolingo), por eso se comprueba ayer
// como alternativa antes de dar la racha por perdida.
export function calcularRachaDias(fechasIso: string[]): number {
  const dias = new Set(fechasIso.map((iso) => claveDia(new Date(iso))));
  const cursor = new Date();

  if (!dias.has(claveDia(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dias.has(claveDia(cursor))) return 0;
  }

  let racha = 0;
  while (dias.has(claveDia(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}
