import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { CatalogoController } from './catalogo.controller.js';
import { CatalogoService } from './catalogo.service.js';
import { HorariosController } from './horarios.controller.js';
import { HorariosService } from './horarios.service.js';

describe('Controladores de horarios y catálogo', () => {
  let horarios: HorariosController;
  let catalogo: CatalogoController;
  const usuario = { id: 'usuario-1', correo: 'ana@example.com' };
  const horariosFalso = {
    listar: vi.fn(),
    obtenerActivo: vi.fn(),
    obtenerCompleto: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    reemplazarFranjas: vi.fn(),
    anadirAsignatura: vi.fn(),
    cambiarColorAsignatura: vi.fn(),
    quitarAsignatura: vi.fn(),
    asignarSesion: vi.fn(),
  };
  const catalogoFalso = {
    listarCursos: vi.fn(),
    listarAsignaturas: vi.fn(),
    crearOptativaPropia: vi.fn(),
    eliminarOptativaPropia: vi.fn(),
  };
  const prismaFalso = { usuario: { findUnique: vi.fn() } };

  beforeEach(async () => {
    vi.clearAllMocks();

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [HorariosController, CatalogoController],
      providers: [
        { provide: HorariosService, useValue: horariosFalso },
        { provide: CatalogoService, useValue: catalogoFalso },
        { provide: ServicioPrisma, useValue: prismaFalso },
      ],
    }).compile();

    horarios = modulo.get(HorariosController);
    catalogo = modulo.get(CatalogoController);
  });

  it('obtenerActivo pasa el id del usuario autenticado', async () => {
    await horarios.obtenerActivo(usuario);
    expect(horariosFalso.obtenerActivo).toHaveBeenCalledWith('usuario-1');
  });

  it('reemplazarFranjas pasa solo la lista de franjas', async () => {
    const franjas = [
      { horaInicio: '09:00', horaFin: '10:00', tipo: 'CLASE' as const },
    ];
    await horarios.reemplazarFranjas(usuario, 'horario-1', { franjas });
    expect(horariosFalso.reemplazarFranjas).toHaveBeenCalledWith(
      'usuario-1',
      'horario-1',
      franjas,
    );
  });

  it('cambiarColorAsignatura pasa el color recibido', async () => {
    await horarios.cambiarColorAsignatura(usuario, 'horario-1', 'ah-1', {
      color: '#123456',
    });
    expect(horariosFalso.cambiarColorAsignatura).toHaveBeenCalledWith(
      'usuario-1',
      'horario-1',
      'ah-1',
      '#123456',
    );
  });

  it('listarAsignaturas pasa el curso y la comunidad del filtro', async () => {
    await catalogo.listarAsignaturas(usuario, 'primaria-3', {
      comunidad: 'GALICIA',
    });
    expect(catalogoFalso.listarAsignaturas).toHaveBeenCalledWith(
      'usuario-1',
      'primaria-3',
      'GALICIA',
    );
  });
});
