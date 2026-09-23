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
import {
  ActualizarEmergenciaDto,
  ActualizarRecordatorioDto,
  CrearRecordatorioDto,
} from './dto/recordatorios.dto.js';
import { GeneradorAvisosService } from './generador-avisos.service.js';
import { RecordatoriosService } from './recordatorios.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('recordatorios')
export class RecordatoriosController {
  constructor(
    private readonly recordatorios: RecordatoriosService,
    private readonly generador: GeneradorAvisosService,
  ) {}

  @Get()
  obtener(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.recordatorios.obtenerConfiguracion(usuario.id);
  }

  @Post()
  crear(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: CrearRecordatorioDto,
  ) {
    return this.recordatorios.crear(usuario.id, datos);
  }

  // Antes que ":id" para que "emergencia" no se tome por un id.
  @Patch('emergencia')
  actualizarEmergencia(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: ActualizarEmergenciaDto,
  ) {
    return this.recordatorios.actualizarEmergencia(usuario.id, datos);
  }

  // Ejecuta ya la comprobación de este usuario sin esperar al cron.
  @Post('comprobar')
  async comprobar(@UsuarioActual() usuario: UsuarioPeticion) {
    return {
      creados: await this.generador.procesarUsuario(usuario.id, new Date(), {
        esperarIa: false,
      }),
    };
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarRecordatorioDto,
  ) {
    return this.recordatorios.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recordatorios.eliminar(usuario.id, id);
  }
}
