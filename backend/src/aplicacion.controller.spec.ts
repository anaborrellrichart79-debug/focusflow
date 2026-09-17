import { Test, TestingModule } from '@nestjs/testing';
import { AplicacionController } from './aplicacion.controller.js';
import { AplicacionService } from './aplicacion.service.js';

describe('AplicacionController', () => {
  let controladorAplicacion: AplicacionController;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AplicacionController],
      providers: [AplicacionService],
    }).compile();

    controladorAplicacion = modulo.get<AplicacionController>(
      AplicacionController,
    );
  });

  describe('raiz', () => {
    it('deberia devolver el mensaje de bienvenida', () => {
      expect(controladorAplicacion.obtenerSaludo()).toBe(
        '¡Bienvenido a la API de FocusFlow!',
      );
    });
  });
});
