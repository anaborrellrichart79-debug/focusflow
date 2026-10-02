import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CLIENTE_STRIPE, PagosService } from './pagos.service.js';
import { PagosController } from './pagos.controller.js';

@Module({
  controllers: [PagosController],
  providers: [
    PagosService,
    // Sin STRIPE_SECRET_KEY la app funciona igual, solo que no se puede pagar.
    {
      provide: CLIENTE_STRIPE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const clave = config.get<string>('STRIPE_SECRET_KEY');
        return clave ? new Stripe(clave) : null;
      },
    },
  ],
  exports: [PagosService],
})
export class ModuloPagos {}
