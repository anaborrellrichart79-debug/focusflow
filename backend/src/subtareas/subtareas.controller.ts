import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { ActualizarSubtareaDto } from './dto/actualizar-subtarea.dto.js';
import { CrearSubtareaDto } from './dto/crear-subtarea.dto.js';
import { SubtareasService } from './subtareas.service.js';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class SubtareasController {
  constructor(private readonly subtareasService: SubtareasService) {}

  @Post('tareas/:tareaId/subtareas')
  crear(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('tareaId') tareaId: string,
    @Body() datos: CrearSubtareaDto,
  ) {
    return this.subtareasService.crear(usuario.id, tareaId, datos);
  }

  @Patch('subtareas/:id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: ActualizarSubtareaDto,
  ) {
    return this.subtareasService.actualizar(usuario.id, id, datos);
  }

  @Delete('subtareas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.subtareasService.eliminar(usuario.id, id);
  }
}
