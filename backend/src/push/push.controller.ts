import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { DesuscribirPushDto, SuscribirPushDto } from './dto/push.dto.js';
import { PushService } from './push.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('clave-publica')
  clavePublica() {
    return this.push.clavePublica();
  }

  @Post('suscripciones')
  @HttpCode(HttpStatus.NO_CONTENT)
  suscribir(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: SuscribirPushDto) {
    return this.push.suscribir(usuario.id, datos);
  }

  @Post('prueba')
  enviarPrueba(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.push.enviarPrueba(usuario.id);
  }

  @Delete('suscripciones')
  @HttpCode(HttpStatus.NO_CONTENT)
  desuscribir(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: DesuscribirPushDto) {
    return this.push.desuscribir(usuario.id, datos.endpoint);
  }
}
