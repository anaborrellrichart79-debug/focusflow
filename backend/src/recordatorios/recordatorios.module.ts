import { Module } from '@nestjs/common';
import { ModuloCorreo } from '../correo/correo.module.js';
import { AvisosController } from './avisos.controller.js';
import { AvisosService } from './avisos.service.js';
import { CalendarioEscolarController } from './calendario-escolar.controller.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';
import { GeneradorAvisosService } from './generador-avisos.service.js';
import { IaService } from './ia.service.js';
import { ProgramadorAvisos } from './programador-avisos.js';
import { RecordatoriosController } from './recordatorios.controller.js';
import { RecordatoriosService } from './recordatorios.service.js';

@Module({
  imports: [ModuloCorreo],
  controllers: [
    RecordatoriosController,
    AvisosController,
    CalendarioEscolarController,
  ],
  providers: [
    RecordatoriosService,
    AvisosService,
    CalendarioEscolarService,
    GeneradorAvisosService,
    IaService,
    ProgramadorAvisos,
  ],
})
export class ModuloRecordatorios {}
