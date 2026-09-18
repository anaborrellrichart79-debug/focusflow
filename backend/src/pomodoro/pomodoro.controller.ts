import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { CrearSesionPomodoroDto } from './dto/crear-sesion-pomodoro.dto.js';
import { PomodoroService } from './pomodoro.service.js';

@UseGuards(AuthGuard('jwt'))
@Controller('pomodoro/sesiones')
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Post()
  registrar(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: CrearSesionPomodoroDto) {
    return this.pomodoroService.registrarSesion(usuario.id, datos);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.pomodoroService.listarPorUsuario(usuario.id);
  }
}
