import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { FasePomodoro } from '../../generated/prisma/enums.js';

export class CrearSesionPomodoroDto {
  @IsEnum(FasePomodoro)
  fase!: FasePomodoro;

  @IsInt()
  @Min(1)
  duracionSegundos!: number;

  @IsOptional()
  @IsUUID()
  tareaId?: string;
}
