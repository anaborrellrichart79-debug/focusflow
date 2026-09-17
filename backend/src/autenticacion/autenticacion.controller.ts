import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutenticacionService } from './autenticacion.service.js';
import { UsuarioActual } from './decoradores/usuario-actual.decorator.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';
import type { UsuarioPeticion } from './interfaces/carga-util-jwt.interface.js';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('registro')
  registrar(@Body() datos: RegistrarUsuarioDto) {
    return this.autenticacionService.registrar(datos);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() datos: IniciarSesionDto) {
    return this.autenticacionService.iniciarSesion(datos);
  }

  @Get('perfil')
  @UseGuards(AuthGuard('jwt'))
  obtenerPerfil(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.autenticacionService.obtenerUsuarioPorId(usuario.id);
  }
}
