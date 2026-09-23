import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import {
  ActualizarNotaDto,
  CrearNotaDto,
  FiltrarNotasDto,
} from './dto/notas.dto.js';
import { NotasService } from './notas.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('notas')
export class NotasController {
  constructor(private readonly notas: NotasService) {}

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Query() filtros: FiltrarNotasDto,
  ) {
    return this.notas.listar(usuario.id, filtros);
  }

  @Post()
  crear(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: CrearNotaDto,
  ) {
    return this.notas.crear(usuario.id, datos);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarNotaDto,
  ) {
    return this.notas.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notas.eliminar(usuario.id, id);
  }
}
