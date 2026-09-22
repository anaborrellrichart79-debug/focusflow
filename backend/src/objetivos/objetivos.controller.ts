import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { ActualizarObjetivoDto } from './dto/actualizar-objetivo.dto.js';
import { CrearObjetivoDto } from './dto/crear-objetivo.dto.js';
import { ObjetivosService } from './objetivos.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('objetivos')
export class ObjetivosController {
  constructor(private readonly objetivosService: ObjetivosService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: CrearObjetivoDto) {
    return this.objetivosService.crear(usuario.id, datos);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.objetivosService.listarPorUsuario(usuario.id);
  }

  @Get(':id')
  obtenerUno(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.objetivosService.obtenerUno(usuario.id, id);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: ActualizarObjetivoDto,
  ) {
    return this.objetivosService.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.objetivosService.eliminar(usuario.id, id);
  }
}
