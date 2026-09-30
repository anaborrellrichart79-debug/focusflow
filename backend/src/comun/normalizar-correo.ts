import { Transform } from 'class-transformer';

// Los correos se guardan y se buscan sin espacios alrededor y en minúsculas:
// el teclado del móvil suele poner la primera letra en mayúscula ("Ana.b...")
// o dejar un espacio al final, y sin esto la cuenta "no existe" al entrar.
export function NormalizarCorreo() {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}
