import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { AvisosService } from './avisos.service.js';
import { MarcarMostradosDto } from './dto/recordatorios.dto.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisos: AvisosService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.avisos.listar(usuario.id);
  }

  @Post('mostrados')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarMostrados(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: MarcarMostradosDto,
  ) {
    return this.avisos.marcarMostrados(usuario.id, datos.ids);
  }

  @Post('leer-todos')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTodosLeidos(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.avisos.marcarTodosLeidos(usuario.id);
  }

  @Post('tareas/:tareaId/revisada')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTareaRevisada(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
  ) {
    return this.avisos.marcarTareaRevisada(usuario.id, tareaId);
  }

  @Patch(':id/leido')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarLeido(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.avisos.marcarLeido(usuario.id, id);
  }
}
