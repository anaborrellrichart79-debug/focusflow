import { IsBoolean } from 'class-validator';

export class ActualizarPreferenciasDto {
  @IsBoolean()
  modoEscolarActivo!: boolean;
}
