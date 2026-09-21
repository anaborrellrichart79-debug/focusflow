import { Module } from '@nestjs/common';
import { SubtareasController } from './subtareas.controller.js';
import { SubtareasService } from './subtareas.service.js';

@Module({
  controllers: [SubtareasController],
  providers: [SubtareasService],
})
export class ModuloSubtareas {}
