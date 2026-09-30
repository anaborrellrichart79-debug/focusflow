// Precio del plan Plus, IVA incluido (a los consumidores se les muestra
// siempre el precio final). Si cambia, hay que cambiarlo también en las
// condiciones del servicio (legal/*.ts, apartado 4) y avisar a los usuarios
// con 30 días de antelación.
export const PRECIO_PLUS_EUROS = 3.99;
// Anual: sale a 2,50 €/mes (unos 4 meses gratis respecto al mensual).
export const PRECIO_PLUS_ANUAL_EUROS = 29.99;

// Usos del asistente al mes: el valor por defecto del backend
// (IA_LIMITE_MENSUAL). Se enseña en la página pública de planes, que no
// tiene sesión para preguntárselo al servidor.
export const LIMITE_USOS_PLUS = 100;

export function formatearPrecio(euros: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(euros);
}
