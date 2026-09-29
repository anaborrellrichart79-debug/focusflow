import { Module } from '@nestjs/common';
import { ModuloPush } from '../push/push.module.js';
import { TareasController } from './tareas.controller.js';
import { TareasService } from './tareas.service.js';

@Module({
  imports: [ModuloPush],
  controllers: [TareasController],
  providers: [TareasService],
  exports: [TareasService],
})
export class ModuloTareas {}
