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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto.js';
import { CrearTareaDto } from './dto/crear-tarea.dto.js';
import { FiltrarTareasDto } from './dto/filtrar-tareas.dto.js';
import { TareasService } from './tareas.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('tareas')
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: CrearTareaDto) {
    return this.tareasService.crear(usuario.id, datos);
  }

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Query() filtros: FiltrarTareasDto,
  ) {
    return this.tareasService.listarPorUsuario(usuario.id, filtros);
  }

  @Get(':id')
  obtenerUna(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.tareasService.obtenerUna(usuario.id, id);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: ActualizarTareaDto,
  ) {
    return this.tareasService.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.tareasService.eliminar(usuario.id, id);
  }
}
