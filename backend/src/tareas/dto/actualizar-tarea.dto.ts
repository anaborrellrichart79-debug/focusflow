import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearTareaDto } from './crear-tarea.dto.js';

export class ActualizarTareaDto extends PartialType(CrearTareaDto) {
  @IsOptional()
  @IsBoolean()
  completada?: boolean;
}
