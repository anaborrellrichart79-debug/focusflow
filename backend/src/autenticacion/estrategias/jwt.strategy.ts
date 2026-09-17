import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  CargaUtilJwt,
  UsuarioPeticion,
} from '../interfaces/carga-util-jwt.interface.js';

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(cargaUtil: CargaUtilJwt): UsuarioPeticion {
    return { id: cargaUtil.sub, correo: cargaUtil.correo };
  }
}
