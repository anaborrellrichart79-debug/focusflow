import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutenticacionService } from './autenticacion.service.js';
import { UsuarioActual } from './decoradores/usuario-actual.decorator.js';
import { ActualizarPreferenciasDto } from './dto/actualizar-preferencias.dto.js';
import { ConfirmarConsentimientoDto } from './dto/confirmar-consentimiento.dto.js';
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

  // Pública a propósito: el enlace del correo al tutor apunta a una página
  // del frontend, que llama a este endpoint con el token recibido — no hay
  // sesión iniciada en ese momento.
  @Post('confirmar-consentimiento')
  @HttpCode(HttpStatus.OK)
  confirmarConsentimiento(@Body() datos: ConfirmarConsentimientoDto) {
    return this.autenticacionService.confirmarConsentimiento(datos.token);
  }

  @Post('reenviar-confirmacion')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  reenviarConfirmacion(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.autenticacionService.reenviarConfirmacion(usuario.id);
  }

  @Patch('preferencias')
  @UseGuards(AuthGuard('jwt'))
  actualizarPreferencias(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: ActualizarPreferenciasDto,
  ) {
    return this.autenticacionService.actualizarPreferencias(usuario.id, datos.modoEscolarActivo);
  }
}
