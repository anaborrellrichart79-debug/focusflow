import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

class ClavesSuscripcionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  auth!: string;
}

// Misma forma que PushSubscription.toJSON() en el navegador.
export class SuscribirPushDto {
  @IsUrl({ protocols: ['https'], require_tld: false })
  @MaxLength(1000)
  endpoint!: string;

  @ValidateNested()
  @Type(() => ClavesSuscripcionDto)
  keys!: ClavesSuscripcionDto;
}

export class DesuscribirPushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  endpoint!: string;
}
