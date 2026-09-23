import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { CatalogoService } from './catalogo.service.js';
import {
  CrearAsignaturaPropiaDto,
  FiltrarAsignaturasDto,
} from './dto/horarios.dto.js';

@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller()
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('cursos')
  listarCursos() {
    return this.catalogoService.listarCursos();
  }

  @Get('cursos/:id/asignaturas')
  listarAsignaturas(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') cursoId: string,
    @Query() filtros: FiltrarAsignaturasDto,
  ) {
    return this.catalogoService.listarAsignaturas(
      usuario.id,
      cursoId,
      filtros.comunidad,
    );
  }

  @Post('asignaturas')
  crearOptativaPropia(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: CrearAsignaturaPropiaDto,
  ) {
    return this.catalogoService.crearOptativaPropia(usuario.id, datos);
  }

  @Delete('asignaturas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarOptativaPropia(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id') id: string,
  ) {
    return this.catalogoService.eliminarOptativaPropia(usuario.id, id);
  }
}
