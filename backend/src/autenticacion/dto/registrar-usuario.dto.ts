import { IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { calcularEdad } from '../../comun/edad.util.js';

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

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento!: string;

  // Solo obligatorio para menores de 18 años: hace falta el correo de un
  // tutor legal para poder confirmar el uso de la cuenta.
  @ValidateIf((datos: RegistrarUsuarioDto) => calcularEdad(datos.fechaNacimiento) < 18)
  @IsEmail(
    {},
    { message: 'Se necesita el correo de un tutor legal para menores de 18 años' },
  )
  correoTutor?: string;
}
