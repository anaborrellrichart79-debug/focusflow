import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearSubtareaDto } from './crear-subtarea.dto.js';

export class ActualizarSubtareaDto extends PartialType(CrearSubtareaDto) {
  @IsOptional()
  @IsBoolean()
  completada?: boolean;
}
