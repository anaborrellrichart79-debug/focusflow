import { Module } from '@nestjs/common';
import { PomodoroController } from './pomodoro.controller.js';
import { PomodoroService } from './pomodoro.service.js';

@Module({
  controllers: [PomodoroController],
  providers: [PomodoroService],
})
export class ModuloPomodoro {}
