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
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import {
  ActualizarAsignaturaHorarioDto,
  ActualizarHorarioDto,
  AnadirAsignaturaHorarioDto,
  AsignarSesionDto,
  CrearHorarioDto,
  ReemplazarFranjasDto,
} from './dto/horarios.dto.js';
import { HorariosService } from './horarios.service.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.horariosService.listar(usuario.id);
  }

  // Declarada antes de ':id' para que "activo" no se interprete como un id.
  @Get('activo')
  obtenerActivo(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.horariosService.obtenerActivo(usuario.id);
  }

  @Get(':id')
  obtenerUno(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
  ) {
    return this.horariosService.obtenerCompleto(usuario.id, id);
  }

  @Post()
  crear(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: CrearHorarioDto,
  ) {
    return this.horariosService.crear(usuario.id, datos);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: ActualizarHorarioDto,
  ) {
    return this.horariosService.actualizar(usuario.id, id, datos);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual() usuario: UsuarioPeticion, @Param('id') id: string) {
    return this.horariosService.eliminar(usuario.id, id);
  }

  @Put(':id/franjas')
  reemplazarFranjas(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: ReemplazarFranjasDto,
  ) {
    return this.horariosService.reemplazarFranjas(
      usuario.id,
      id,
      datos.franjas,
    );
  }

  @Post(':id/asignaturas')
  anadirAsignatura(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: AnadirAsignaturaHorarioDto,
  ) {
    return this.horariosService.anadirAsignatura(usuario.id, id, datos);
  }

  @Patch(':id/asignaturas/:asignaturaHorarioId')
  cambiarColorAsignatura(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Param('asignaturaHorarioId') asignaturaHorarioId: string,
    @Body() datos: ActualizarAsignaturaHorarioDto,
  ) {
    return this.horariosService.cambiarColorAsignatura(
      usuario.id,
      id,
      asignaturaHorarioId,
      datos.color,
    );
  }

  @Delete(':id/asignaturas/:asignaturaHorarioId')
  quitarAsignatura(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Param('asignaturaHorarioId') asignaturaHorarioId: string,
  ) {
    return this.horariosService.quitarAsignatura(
      usuario.id,
      id,
      asignaturaHorarioId,
    );
  }

  @Put(':id/sesiones')
  asignarSesion(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
    @Body() datos: AsignarSesionDto,
  ) {
    return this.horariosService.asignarSesion(usuario.id, id, datos);
  }
}
