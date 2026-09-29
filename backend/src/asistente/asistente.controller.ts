import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { AsistenteService } from './asistente.service.js';

// POST porque cada llamada genera algo nuevo (y tarda), aunque no guarda nada.
@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('tareas/:id/ia')
export class AsistenteController {
  constructor(private readonly asistente: AsistenteService) {}

  @Post('subtareas')
  @HttpCode(HttpStatus.OK)
  proponerSubtareas(@UsuarioActual() usuario: UsuarioPeticion, @Param('id', ParseUUIDPipe) id: string) {
    return this.asistente.proponerSubtareas(usuario.id, id);
  }

  @Post('plan-estudio')
  @HttpCode(HttpStatus.OK)
  proponerPlanEstudio(@UsuarioActual() usuario: UsuarioPeticion, @Param('id', ParseUUIDPipe) id: string) {
    return this.asistente.proponerPlanEstudio(usuario.id, id);
  }
}
