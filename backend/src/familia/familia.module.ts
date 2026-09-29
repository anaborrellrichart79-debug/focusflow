import { Module } from '@nestjs/common';
import { ModuloPush } from '../push/push.module.js';
import { FamiliaController } from './familia.controller.js';
import { FamiliaService } from './familia.service.js';

@Module({
  imports: [ModuloPush],
  controllers: [FamiliaController],
  providers: [FamiliaService],
})
export class ModuloFamilia {}
