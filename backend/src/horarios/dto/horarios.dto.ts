import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { ComunidadAutonoma, TipoFranja } from '../../generated/prisma/enums.js';

// Hora de reloj "HH:mm" en 24 h (00:00-23:59).
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMATO_COLOR = /^#[0-9a-fA-F]{6}$/;

export class FiltrarAsignaturasDto {
  @IsOptional()
  @IsEnum(ComunidadAutonoma)
  comunidad?: ComunidadAutonoma;
}

export class CrearAsignaturaPropiaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  cursoId!: string;
}

export class CrearHorarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  periodo!: string;

  @IsString()
  @IsNotEmpty()
  cursoId!: string;

  @IsEnum(ComunidadAutonoma)
  comunidad!: ComunidadAutonoma;
}

export class ActualizarHorarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  periodo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursoId?: string;

  @IsOptional()
  @IsEnum(ComunidadAutonoma)
  comunidad?: ComunidadAutonoma;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class FranjaDto {
  // Id de una franja ya existente que se conserva (y con ella sus celdas);
  // sin id, se crea una franja nueva.
  @IsOptional()
  @IsUUID()
  id?: string;

  @Matches(FORMATO_HORA)
  horaInicio!: string;

  @Matches(FORMATO_HORA)
  horaFin!: string;

  @IsEnum(TipoFranja)
  tipo!: TipoFranja;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  etiqueta?: string;
}

export class ReemplazarFranjasDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FranjaDto)
  franjas!: FranjaDto[];
}

export class AnadirAsignaturaHorarioDto {
  @IsString()
  @IsNotEmpty()
  asignaturaId!: string;

  @IsOptional()
  @Matches(FORMATO_COLOR)
  color?: string;
}

export class ActualizarAsignaturaHorarioDto {
  @Matches(FORMATO_COLOR)
  color!: string;
}

export class AsignarSesionDto {
  @IsUUID()
  franjaId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  diaSemana!: number;

  // null vacía la celda.
  @ValidateIf((_, valor) => valor !== null)
  @IsUUID()
  asignaturaHorarioId!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  aula?: string;
}
