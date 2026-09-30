import {
  Body,
  Controller,
  Delete,
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
import { EliminarCuentaDto } from './dto/eliminar-cuenta.dto.js';
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

  // Pública por lo mismo que confirmar-consentimiento: el enlace del correo
  // se puede abrir en un navegador sin sesión (p. ej. el del móvil). El DTO
  // es el mismo, solo lleva el token.
  @Post('verificar-correo')
  @HttpCode(HttpStatus.OK)
  verificarCorreo(@Body() datos: ConfirmarConsentimientoDto) {
    return this.autenticacionService.verificarCorreo(datos.token);
  }

  @Post('reenviar-verificacion')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  reenviarVerificacion(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.autenticacionService.reenviarVerificacion(usuario.id);
  }

  @Delete('cuenta')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarCuenta(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: EliminarCuentaDto) {
    return this.autenticacionService.eliminarCuenta(usuario.id, datos.contrasena);
  }

  @Patch('preferencias')
  @UseGuards(AuthGuard('jwt'))
  actualizarPreferencias(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: ActualizarPreferenciasDto,
  ) {
    return this.autenticacionService.actualizarPreferencias(usuario.id, datos);
  }
}
