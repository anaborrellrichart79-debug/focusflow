import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { EtiquetasController } from './etiquetas.controller.js';
import { EtiquetasService } from './etiquetas.service.js';

describe('EtiquetasController', () => {
  let controlador: EtiquetasController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const servicioFalso = {
    listarPorUsuario: vi.fn(),
  };
  const prismaFalso = { usuario: { findUnique: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [EtiquetasController],
      providers: [
        { provide: EtiquetasService, useValue: servicioFalso },
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();

    controlador = modulo.get(EtiquetasController);
  });

  it('listar pasa el id del usuario autenticado', async () => {
    await controlador.listar(usuario);
    expect(servicioFalso.listarPorUsuario).toHaveBeenCalledWith('usuario-1');
  });
});
