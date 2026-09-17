import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearObjetivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
}
