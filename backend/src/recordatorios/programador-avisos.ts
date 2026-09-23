import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GeneradorAvisosService } from './generador-avisos.service.js';

// Tarea programada (cron) que revisa cada 5 minutos si toca algún aviso. Corre
// dentro del propio backend: funciona con la app cerrada en el navegador, pero
// no con el backend parado.
@Injectable()
export class ProgramadorAvisos {
  private readonly logger = new Logger(ProgramadorAvisos.name);
  private enCurso = false;

  constructor(private readonly generador: GeneradorAvisosService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async ejecutar() {
    // Ollama puede tardar más de 5 minutos si hay muchos usuarios: nunca dos
    // pasadas a la vez.
    if (this.enCurso) return;
    this.enCurso = true;
    try {
      await this.generador.procesarTodos();
    } catch (error) {
      this.logger.error('Error en la pasada de avisos', error as Error);
    } finally {
      this.enCurso = false;
    }
  }
}
