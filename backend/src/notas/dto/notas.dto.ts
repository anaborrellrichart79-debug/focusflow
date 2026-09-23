import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TipoNota } from '../../generated/prisma/enums.js';

export class FiltrarNotasDto {
  @IsOptional()
  @IsEnum(TipoNota)
  tipo?: TipoNota;

  @IsOptional()
  @IsUUID()
  tareaId?: string;

  @IsOptional()
  @IsUUID()
  objetivoId?: string;
}

export class CrearNotaDto {
  @IsEnum(TipoNota)
  tipo!: TipoNota;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  contenido!: string;

  // Solo para NOTA: los to-dos llevan casilla siempre.
  @IsOptional()
  @IsBoolean()
  conCasilla?: boolean;

  @IsOptional()
  @IsUUID()
  tareaId?: string;

  @IsOptional()
  @IsUUID()
  objetivoId?: string;
}

export class ActualizarNotaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  contenido?: string;

  @IsOptional()
  @IsBoolean()
  conCasilla?: boolean;

  @IsOptional()
  @IsBoolean()
  completada?: boolean;

  // null la desvincula.
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  tareaId?: string | null;

  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  objetivoId?: string | null;
}
