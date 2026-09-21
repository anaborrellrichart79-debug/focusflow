import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { EtiquetasService } from './etiquetas.service.js';

@UseGuards(AuthGuard('jwt'))
@Controller('etiquetas')
export class EtiquetasController {
  constructor(private readonly etiquetasService: EtiquetasService) {}

  @Get()
  listar(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.etiquetasService.listarPorUsuario(usuario.id);
  }
}
