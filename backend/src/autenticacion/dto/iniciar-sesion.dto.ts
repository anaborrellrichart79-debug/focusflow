import { IsEmail, IsString } from 'class-validator';

export class IniciarSesionDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo!: string;

  @IsString()
  contrasena!: string;
}
