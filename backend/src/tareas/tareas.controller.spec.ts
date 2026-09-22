import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { TareasController } from './tareas.controller.js';
import { TareasService } from './tareas.service.js';

describe('TareasController', () => {
  let controlador: TareasController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const servicioFalso = {
    crear: vi.fn(),
    listarPorUsuario: vi.fn(),
    obtenerUna: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };
  // GuardaConsentimientoConfirmado (aplicado a nivel de clase junto a
  // AuthGuard('jwt')) necesita poder resolverse en el módulo de test, aunque
  // estos tests llamen al controlador directamente sin pasar por el pipeline
  // HTTP de guards.
  const prismaFalso = { usuario: { findUnique: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [TareasController],
      providers: [
        { provide: TareasService, useValue: servicioFalso },
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();

    controlador = modulo.get(TareasController);
  });

  it('crear pasa el id del usuario autenticado, no uno que venga en el body', async () => {
    await controlador.crear(usuario, { titulo: 'Tarea nueva' });
    expect(servicioFalso.crear).toHaveBeenCalledWith('usuario-1', { titulo: 'Tarea nueva' });
  });

  it('listar reenvía los filtros de query junto al usuario autenticado', async () => {
    await controlador.listar(usuario, { estado: 'HECHA' });
    expect(servicioFalso.listarPorUsuario).toHaveBeenCalledWith('usuario-1', { estado: 'HECHA' });
  });

  it('obtenerUna pasa el usuario y el id de la ruta', async () => {
    await controlador.obtenerUna(usuario, 'tarea-1');
    expect(servicioFalso.obtenerUna).toHaveBeenCalledWith('usuario-1', 'tarea-1');
  });

  it('actualizar pasa el usuario, el id y los datos del body', async () => {
    await controlador.actualizar(usuario, 'tarea-1', { estado: 'EN_PROCESO' });
    expect(servicioFalso.actualizar).toHaveBeenCalledWith('usuario-1', 'tarea-1', {
      estado: 'EN_PROCESO',
    });
  });

  it('eliminar pasa el usuario y el id de la ruta', async () => {
    await controlador.eliminar(usuario, 'tarea-1');
    expect(servicioFalso.eliminar).toHaveBeenCalledWith('usuario-1', 'tarea-1');
  });
});
