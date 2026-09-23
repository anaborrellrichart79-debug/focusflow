import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PerfilUsuario } from '../../generated/prisma/enums.js';

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
}
