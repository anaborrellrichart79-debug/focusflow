import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmarConsentimientoDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
