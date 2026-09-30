import { Module } from '@nestjs/common';
import { ModuloIa } from '../ia/ia.module.js';
import { ModuloPlanes } from '../planes/planes.module.js';
import { AsistenteController } from './asistente.controller.js';
import { AsistenteService } from './asistente.service.js';

@Module({
  imports: [ModuloIa, ModuloPlanes],
  controllers: [AsistenteController],
  providers: [AsistenteService],
})
export class ModuloAsistente {}
