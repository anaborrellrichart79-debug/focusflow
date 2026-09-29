import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';
import { IDIOMAS, type Idioma } from '../../comun/idiomas.js';
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

  @IsOptional()
  @IsIn(IDIOMAS)
  idioma?: Idioma;
}
