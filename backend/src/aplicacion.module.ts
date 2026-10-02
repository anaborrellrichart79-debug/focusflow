import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AplicacionController } from './aplicacion.controller.js';
import { AplicacionService } from './aplicacion.service.js';
import { ModuloAsistente } from './asistente/asistente.module.js';
import { ModuloPlanes } from './planes/planes.module.js';
import { ModuloFotos } from './fotos/fotos.module.js';
import { FiltroErrores } from './comun/filtro-errores.js';
import { ModuloAutenticacion } from './autenticacion/autenticacion.module.js';
import { ModuloEtiquetas } from './etiquetas/etiquetas.module.js';
import { ModuloFamilia } from './familia/familia.module.js';
import { ModuloGoogle } from './google/google.module.js';
import { ModuloNotas } from './notas/notas.module.js';
import { ModuloPagos } from './pagos/pagos.module.js';
import { ModuloHorarios } from './horarios/horarios.module.js';
import { ModuloObjetivos } from './objetivos/objetivos.module.js';
import { ModuloPomodoro } from './pomodoro/pomodoro.module.js';
import { ModuloPrisma } from './prisma/prisma.module.js';
import { ModuloPush } from './push/push.module.js';
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
    ModuloNotas,
    ModuloPush,
    ModuloAsistente,
    ModuloPlanes,
    ModuloFotos,
    ModuloPagos,
  ],
  controllers: [AplicacionController],
  // FiltroErrores añade a cada error el código que traduce el frontend.
  providers: [AplicacionService, { provide: APP_FILTER, useClass: FiltroErrores }],
})
export class AplicacionModule {}
