import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import {
  AsignarTareaDto,
  RevisarTareaDto,
  VincularDto,
} from './dto/familia.dto.js';
import { FamiliaService } from './familia.service.js';

// El consentimiento se exige método a método: obtener el estado y generar el
// código quedan abiertos a una cuenta pendiente de confirmar, porque el
// vínculo familiar es una de las vías para confirmarla (ver vincular).
@UseGuards(AuthGuard('jwt'))
@Controller('familia')
export class FamiliaController {
  constructor(private readonly familia: FamiliaService) {}

  @Get()
  obtener(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.familia.obtener(usuario.id);
  }

  @Post('codigo')
  generarCodigo(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.familia.generarCodigo(usuario.id);
  }

  @Post('vincular')
  @UseGuards(GuardaConsentimientoConfirmado)
  vincular(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Body() datos: VincularDto,
  ) {
    return this.familia.vincular(usuario.id, datos.codigo);
  }

  @Delete('vinculos/:id')
  @UseGuards(GuardaConsentimientoConfirmado)
  @HttpCode(HttpStatus.NO_CONTENT)
  desvincular(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.familia.desvincular(usuario.id, id);
  }

  @Get('supervisados/:id/tareas')
  @UseGuards(GuardaConsentimientoConfirmado)
  listarTareas(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.familia.listarTareasSupervisado(usuario.id, id);
  }

  @Post('supervisados/:id/tareas')
  @UseGuards(GuardaConsentimientoConfirmado)
  asignarTarea(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: AsignarTareaDto,
  ) {
    return this.familia.asignarTarea(usuario.id, id, datos);
  }

  @Post('tareas/:tareaId/revision')
  @UseGuards(GuardaConsentimientoConfirmado)
  revisar(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Body() datos: RevisarTareaDto,
  ) {
    return this.familia.revisar(usuario.id, tareaId, datos);
  }
}
