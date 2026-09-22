import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Recurrencia } from '../../generated/prisma/enums.js';

export class CrearTareaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  objetivoId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaLimite?: Date;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  etiquetas?: string[];

  @IsOptional()
  @IsEnum(Recurrencia)
  recurrencia?: Recurrencia;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  tiempoEstimadoMinutos?: number;

  // Solo tiene sentido cuando fechaLimite lleva una hora de inicio real (no
  // medianoche); ver el comentario del campo en schema.prisma.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  duracionMinutos?: number;
}
