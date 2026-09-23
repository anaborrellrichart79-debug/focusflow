import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CrearEtiquetaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nombre!: string;

  @IsOptional()
  @IsUUID()
  padreId?: string;
}

export class ActualizarEtiquetaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nombre?: string;

  // null la saca al primer nivel.
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  padreId?: string | null;
}
