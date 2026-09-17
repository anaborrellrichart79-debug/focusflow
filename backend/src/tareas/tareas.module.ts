import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller.js';
import { TareasService } from './tareas.service.js';

@Module({
  controllers: [TareasController],
  providers: [TareasService],
  exports: [TareasService],
})
export class ModuloTareas {}
