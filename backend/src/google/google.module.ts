import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GoogleController } from './google.controller.js';
import { GoogleService } from './google.service.js';

@Module({
  imports: [
    // Registro propio de JwtModule (no se reutiliza el de ModuloAutenticacion,
    // que no lo exporta): firma el parámetro "state" del flujo OAuth con la
    // misma JWT_SECRET, siguiendo el patrón de módulos autocontenidos de este
    // proyecto.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
})
export class ModuloGoogle {}
