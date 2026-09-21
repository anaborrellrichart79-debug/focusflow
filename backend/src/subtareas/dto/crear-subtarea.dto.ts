import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearSubtareaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;
}
