import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TipoRecordatorio } from '../../generated/prisma/enums.js';

// Hora de reloj "HH:mm" en 24 h (00:00-23:59).
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class CrearRecordatorioDto {
  @IsEnum(TipoRecordatorio)
  tipo!: TipoRecordatorio;

  @ValidateIf(
    (datos: CrearRecordatorioDto) =>
      datos.tipo === TipoRecordatorio.REVISION_SEMANAL,
  )
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana?: number;

  @ValidateIf(
    (datos: CrearRecordatorioDto) =>
      datos.tipo === TipoRecordatorio.REVISION_SEMANAL,
  )
  @Matches(FORMATO_HORA)
  hora?: string;

  // Hasta una semana antes de la entrega.
  @ValidateIf(
    (datos: CrearRecordatorioDto) => datos.tipo === TipoRecordatorio.ENTREGA,
  )
  @IsInt()
  @Min(1)
  @Max(168)
  horasAntes?: number;

  @ValidateIf(
    (datos: CrearRecordatorioDto) => datos.tipo === TipoRecordatorio.VACACIONES,
  )
  @IsInt()
  @Min(0)
  @Max(30)
  diasAntes?: number;

  @IsOptional()
  @IsBoolean()
  soloEscolar?: boolean;

  @IsOptional()
  @IsBoolean()
  porCorreo?: boolean;
}

// El tipo no se cambia: se borra y se crea otro.
export class ActualizarRecordatorioDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana?: number;

  @IsOptional()
  @Matches(FORMATO_HORA)
  hora?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  horasAntes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  diasAntes?: number;

  @IsOptional()
  @IsBoolean()
  soloEscolar?: boolean;

  @IsOptional()
  @IsBoolean()
  porCorreo?: boolean;
}

export class ActualizarEmergenciaDto {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  dias?: number;

  @IsOptional()
  @IsBoolean()
  porCorreo?: boolean;
}

export class MarcarMostradosDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class CrearDiaNoLectivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre!: string;

  @Matches(FORMATO_FECHA)
  inicio!: string;

  @Matches(FORMATO_FECHA)
  fin!: string;
}
