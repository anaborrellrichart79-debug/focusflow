import { Module } from '@nestjs/common';
import { ModuloHorarios } from '../horarios/horarios.module.js';
import { ModuloIa } from '../ia/ia.module.js';
import { ModuloPlanes } from '../planes/planes.module.js';
import { FotosController } from './fotos.controller.js';
import { FotosService } from './fotos.service.js';

@Module({
  imports: [ModuloIa, ModuloPlanes, ModuloHorarios],
  controllers: [FotosController],
  providers: [FotosService],
})
export class ModuloFotos {}
