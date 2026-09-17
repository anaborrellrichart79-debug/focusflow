import { Controller, Get } from '@nestjs/common';
import { AplicacionService } from './aplicacion.service.js';

@Controller()
export class AplicacionController {
  constructor(private readonly aplicacionService: AplicacionService) {}

  @Get()
  obtenerSaludo(): string {
    return this.aplicacionService.obtenerSaludo();
  }
}
