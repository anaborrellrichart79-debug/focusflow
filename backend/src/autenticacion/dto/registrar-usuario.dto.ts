import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegistrarUsuarioDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  contrasena!: string;

  @IsOptional()
  @IsString()
  nombre?: string;
}
