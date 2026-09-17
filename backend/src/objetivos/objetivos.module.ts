import { Module } from '@nestjs/common';
import { ObjetivosController } from './objetivos.controller.js';
import { ObjetivosService } from './objetivos.service.js';

@Module({
  controllers: [ObjetivosController],
  providers: [ObjetivosService],
  exports: [ObjetivosService],
})
export class ModuloObjetivos {}
