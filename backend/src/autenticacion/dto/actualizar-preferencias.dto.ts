import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { IDIOMAS, type Idioma } from '../../comun/idiomas.js';
import { PerfilUsuario } from '../../generated/prisma/enums.js';

// Duraciones del Pomodoro en minutos: desde 5 de trabajo y 1 de descanso
// (para los más pequeños) hasta sesiones largas de adulto.
export class ConfigPomodoroDto {
  @IsInt()
  @Min(5)
  @Max(90)
  trabajo!: number;

  @IsInt()
  @Min(1)
  @Max(30)
  descansoCorto!: number;

  @IsInt()
  @Min(1)
  @Max(60)
  descansoLargo!: number;

  // Cada cuántas vueltas de trabajo toca el descanso largo.
  @IsInt()
  @Min(2)
  @Max(8)
  ciclos!: number;
}

export class ActualizarPreferenciasDto {
  @IsOptional()
  @IsBoolean()
  modoEscolarActivo?: boolean;

  // Estudiante, Profesional y/o Padre: personalizan el Inicio.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(PerfilUsuario, { each: true })
  perfiles?: PerfilUsuario[];

  @IsOptional()
  @IsIn(IDIOMAS)
  idioma?: Idioma;

  // Solo se puede marcar como hecha (terminar o saltar el asistente).
  @IsOptional()
  @IsIn([true])
  bienvenidaCompletada?: true;

  // null vuelve a la configuración que toca por edad.
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfigPomodoroDto)
  pomodoro?: ConfigPomodoroDto | null;
}
