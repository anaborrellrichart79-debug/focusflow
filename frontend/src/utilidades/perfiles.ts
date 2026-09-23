import type { PerfilUsuario, UsuarioSesion } from '@/servicios/autenticacion';

export const PERFILES: PerfilUsuario[] = ['ESTUDIANTE', 'PROFESIONAL', 'PADRE'];

// Lo que la app deduce de lo que se usa: con el modo escolar, Estudiante; si
// se supervisa a alguien (Familia), Padre; si no se es estudiante, Profesional.
export function perfilesSugeridos(
  usuario: Pick<UsuarioSesion, 'modoEscolarActivo'>,
  numeroSupervisados: number,
): PerfilUsuario[] {
  const sugeridos: PerfilUsuario[] = [];
  if (usuario.modoEscolarActivo) sugeridos.push('ESTUDIANTE');
  else sugeridos.push('PROFESIONAL');
  if (numeroSupervisados > 0) sugeridos.push('PADRE');
  return sugeridos;
}

// Los elegidos en Ajustes mandan; sin elegir, los sugeridos.
export function perfilesEfectivos(
  usuario: Pick<UsuarioSesion, 'modoEscolarActivo' | 'perfiles'>,
  numeroSupervisados: number,
): { perfiles: PerfilUsuario[]; sugeridos: boolean } {
  if (usuario.perfiles && usuario.perfiles.length > 0) {
    return { perfiles: usuario.perfiles, sugeridos: false };
  }
  return { perfiles: perfilesSugeridos(usuario, numeroSupervisados), sugeridos: true };
}
