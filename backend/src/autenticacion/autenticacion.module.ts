import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ModuloCorreo } from '../correo/correo.module.js';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';
import { EstrategiaJwt } from './estrategias/jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    ModuloCorreo,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get('JWT_EXPIRES_IN_SEGUNDOS')) || 604_800,
        },
      }),
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, EstrategiaJwt],
})
export class ModuloAutenticacion {}
