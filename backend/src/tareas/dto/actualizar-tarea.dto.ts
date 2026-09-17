import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { EstadoTarea } from '../../generated/prisma/enums.js';
import { CrearTareaDto } from './crear-tarea.dto.js';

export class ActualizarTareaDto extends PartialType(CrearTareaDto) {
  @IsOptional()
  @IsEnum(EstadoTarea)
  estado?: EstadoTarea;

  @IsOptional()
  @IsBoolean()
  urgente?: boolean;

  @IsOptional()
  @IsBoolean()
  importante?: boolean;

  @IsOptional()
  @IsBoolean()
  esAltoImpacto?: boolean;
}
