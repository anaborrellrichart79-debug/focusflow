import { Module } from '@nestjs/common';
import { FamiliaController } from './familia.controller.js';
import { FamiliaService } from './familia.service.js';

@Module({
  controllers: [FamiliaController],
  providers: [FamiliaService],
})
export class ModuloFamilia {}
