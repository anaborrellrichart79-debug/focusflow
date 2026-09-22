import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Ambito } from '../../generated/prisma/enums.js';

export class CrearObjetivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaLimite?: Date;

  @IsOptional()
  @IsEnum(Ambito)
  ambito?: Ambito;
}
