import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AplicacionController } from './aplicacion.controller.js';
import { AplicacionService } from './aplicacion.service.js';
import { ModuloAutenticacion } from './autenticacion/autenticacion.module.js';
import { ModuloEtiquetas } from './etiquetas/etiquetas.module.js';
import { ModuloFamilia } from './familia/familia.module.js';
import { ModuloGoogle } from './google/google.module.js';
import { ModuloHorarios } from './horarios/horarios.module.js';
import { ModuloObjetivos } from './objetivos/objetivos.module.js';
import { ModuloPomodoro } from './pomodoro/pomodoro.module.js';
import { ModuloPrisma } from './prisma/prisma.module.js';
import { ModuloRecordatorios } from './recordatorios/recordatorios.module.js';
import { ModuloSubtareas } from './subtareas/subtareas.module.js';
import { ModuloTareas } from './tareas/tareas.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ModuloPrisma,
    ModuloAutenticacion,
    ModuloObjetivos,
    ModuloTareas,
    ModuloSubtareas,
    ModuloEtiquetas,
    ModuloPomodoro,
    ModuloGoogle,
    ModuloHorarios,
    ModuloRecordatorios,
    ModuloFamilia,
  ],
  controllers: [AplicacionController],
  providers: [AplicacionService],
})
export class AplicacionModule {}
