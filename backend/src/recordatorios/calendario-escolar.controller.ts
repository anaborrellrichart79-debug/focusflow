import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';
import { CrearDiaNoLectivoDto } from './dto/recordatorios.dto.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('calendario-escolar')
export class CalendarioEscolarController {
  constructor(private readonly calendario: CalendarioEscolarService) {}

  @Get()
  obtener(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.calendario.obtener(usuario.id);
  }

  @Post('propios')
  crearPropio(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: CrearDiaNoLectivoDto,
  ) {
    return this.calendario.crearPropio(usuario.id, datos);
  }

  @Delete('propios/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarPropio(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendario.eliminarPropio(usuario.id, id);
  }
}
