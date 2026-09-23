import { Module } from '@nestjs/common';
import { CatalogoController } from './catalogo.controller.js';
import { CatalogoService } from './catalogo.service.js';
import { HorariosController } from './horarios.controller.js';
import { HorariosService } from './horarios.service.js';

@Module({
  controllers: [CatalogoController, HorariosController],
  providers: [CatalogoService, HorariosService],
})
export class ModuloHorarios {}
