import { IsEmail, IsString } from 'class-validator';
import { NormalizarCorreo } from '../../comun/normalizar-correo.js';

export class IniciarSesionDto {
  @NormalizarCorreo()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo!: string;

  @IsString()
  contrasena!: string;
}
