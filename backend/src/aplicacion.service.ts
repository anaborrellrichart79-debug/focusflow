import { Injectable } from '@nestjs/common';

@Injectable()
export class AplicacionService {
  obtenerSaludo(): string {
    return '¡Bienvenido a la API de FocusFlow!';
  }
}
