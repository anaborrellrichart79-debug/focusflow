import { Controller, Delete, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { GoogleService } from './google.service.js';

@Controller('google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly config: ConfigService,
  ) {}

  @Get('conectar')
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  conectar(@UsuarioActual() usuario: UsuarioPeticion) {
    return { url: this.googleService.generarUrlAutorizacion(usuario.id) };
  }

  // Ruta pública: Google redirige aquí desde el navegador sin cabecera
  // Authorization. La identidad del usuario viaja en el parámetro "state",
  // un JWT de corta duración firmado al generar la URL de autorización.
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    try {
      await this.googleService.manejarCallback(code, state);
      res.redirect(`${frontendUrl}/ajustes?google=conectado`);
    } catch {
      res.redirect(`${frontendUrl}/ajustes?google=error`);
    }
  }

  @Post('sincronizar')
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  sincronizar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.googleService.sincronizar(usuario.id);
  }

  @Delete('desconectar')
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  desconectar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.googleService.desconectar(usuario.id);
  }

  @Get('estado')
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  estado(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.googleService.obtenerEstado(usuario.id);
  }
}
