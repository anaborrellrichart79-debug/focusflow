import { PartialType } from '@nestjs/mapped-types';
import { CrearObjetivoDto } from './crear-objetivo.dto.js';

export class ActualizarObjetivoDto extends PartialType(CrearObjetivoDto) {}
