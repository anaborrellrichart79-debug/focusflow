import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import { CrearCheckoutDto } from './dto/pagos.dto.js';
import { PagosService } from './pagos.service.js';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  // Devuelve la URL de la página de pago de Stripe.
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  @Post('checkout')
  crearCheckout(@UsuarioActual() usuario: UsuarioPeticion, @Body() datos: CrearCheckoutDto) {
    return this.pagos.crearCheckout(usuario.id, datos.periodo);
  }

  // Devuelve la URL del portal de cliente de Stripe (baja, tarjeta, facturas).
  @UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
  @Post('portal')
  crearPortal(@UsuarioActual() usuario: UsuarioPeticion) {
    return this.pagos.crearPortal(usuario.id);
  }

  // Público: lo llama Stripe. La firma garantiza que viene de Stripe.
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() peticion: RawBodyRequest<Request>, @Headers('stripe-signature') firma?: string) {
    await this.pagos.procesarWebhook(peticion.rawBody, firma);
    return { recibido: true };
  }
}
