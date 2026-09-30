import { IsNotEmpty, IsString } from 'class-validator';

// Para borrar la cuenta hay que repetir la contraseña: así no se borra por
// error ni desde un dispositivo que alguien se ha dejado con la sesión abierta.
export class EliminarCuentaDto {
  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
