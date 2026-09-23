import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Ambito, TipoEscolar } from '../../generated/prisma/enums.js';

export class VincularDto {
  @IsString()
  @Length(6, 6)
  codigo!: string;
}

// Tarea que un responsable crea en la cuenta de la persona que supervisa.
export class AsignarTareaDto {
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

  @IsOptional()
  @IsEnum(TipoEscolar)
  tipoEscolar?: TipoEscolar;
}

export class RevisarTareaDto {
  @IsIn(['APROBADA', 'DEVUELTA'])
  decision!: 'APROBADA' | 'DEVUELTA';

  // Al devolver una tarea hay que decir qué falta.
  @ValidateIf(
    (datos: RevisarTareaDto) =>
      datos.decision === 'DEVUELTA' || datos.comentario != null,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comentario?: string;
}
