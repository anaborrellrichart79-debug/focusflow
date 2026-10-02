import { IsIn } from 'class-validator';
import type { PeriodoPlus } from '../pagos.service.js';

export class CrearCheckoutDto {
  @IsIn(['MENSUAL', 'ANUAL'])
  periodo!: PeriodoPlus;
}
