// Cálculo simple de edad en años completos a partir de una fecha de
// nacimiento, sin depender de ninguna librería de fechas.
export function calcularEdad(fechaNacimiento: Date | string, ahora: Date = new Date()): number {
  const nacimiento = new Date(fechaNacimiento);
  let edad = ahora.getUTCFullYear() - nacimiento.getUTCFullYear();

  const aunNoHaCumplidoEsteAnio =
    ahora.getUTCMonth() < nacimiento.getUTCMonth() ||
    (ahora.getUTCMonth() === nacimiento.getUTCMonth() && ahora.getUTCDate() < nacimiento.getUTCDate());

  if (aunNoHaCumplidoEsteAnio) {
    edad -= 1;
  }

  return edad;
}
