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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { ActualizarEtiquetaDto, CrearEtiquetaDto } from './dto/etiquetas.dto.js';
import { EtiquetasService } from './etiquetas.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('etiquetas')
export class EtiquetasController {
  constructor(private readonly etiquetasService: EtiquetasService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.etiquetasService.listarPorUsuario(usuario.id);
  }

  @Post()
  crear(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: CrearEtiquetaDto) {
    return this.etiquetasService.crear(usuario.id, datos);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarEtiquetaDto,
  ) {
    return this.etiquetasService.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id', ParseUUIDPipe) id: string) {
    return this.etiquetasService.eliminar(usuario.id, id);
  }
}
