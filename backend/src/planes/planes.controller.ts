import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { PlanesService } from './planes.service.js';

@UseGuards(AuthGuard('jwt'))
@Controller('planes')
export class PlanesController {
  constructor(private readonly planes: PlanesService) {}

  // Si la cuenta tiene la IA (y por qué) y cuántos usos lleva este mes.
  @Get('ia')
  estadoIa(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.planes.estadoIa(usuario.id);
  }
}
