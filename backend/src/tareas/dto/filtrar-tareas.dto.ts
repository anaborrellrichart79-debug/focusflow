import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EstadoTarea } from '../../generated/prisma/enums.js';

export class FiltrarTareasDto {
  @IsOptional()
  @IsUUID()
  objetivoId?: string;

  @IsOptional()
  @IsEnum(EstadoTarea)
  estado?: EstadoTarea;
}
