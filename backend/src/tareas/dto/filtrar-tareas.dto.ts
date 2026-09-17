import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class FiltrarTareasDto {
  @IsOptional()
  @IsUUID()
  objetivoId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  completada?: boolean;
}
