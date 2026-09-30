import { Module } from '@nestjs/common';
import { ModuloCorreo } from '../correo/correo.module.js';
import { ModuloIa } from '../ia/ia.module.js';
import { ModuloPlanes } from '../planes/planes.module.js';
import { ModuloPush } from '../push/push.module.js';
import { AvisosController } from './avisos.controller.js';
import { AvisosService } from './avisos.service.js';
import { CalendarioEscolarController } from './calendario-escolar.controller.js';
import { CalendarioEscolarService } from './calendario-escolar.service.js';
import { GeneradorAvisosService } from './generador-avisos.service.js';
import { ProgramadorAvisos } from './programador-avisos.js';
import { RecordatoriosController } from './recordatorios.controller.js';
import { RecordatoriosService } from './recordatorios.service.js';

@Module({
  imports: [ModuloCorreo, ModuloIa, ModuloPlanes, ModuloPush],
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
    ProgramadorAvisos,
  ],
})
export class ModuloRecordatorios {}
