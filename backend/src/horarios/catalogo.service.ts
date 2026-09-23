import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  CategoriaAsignatura,
  type ComunidadAutonoma,
} from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { ASIGNATURAS, CURSOS } from './catalogo-lomloe.js';
import type { CrearAsignaturaPropiaDto } from './dto/horarios.dto.js';

@Injectable()
export class CatalogoService implements OnModuleInit {
  private readonly registro = new Logger(CatalogoService.name);

  constructor(private readonly prisma: ServicioPrisma) {}

  // Carga el catálogo oficial al arrancar. Es idempotente (ids fijos +
  // skipDuplicates), así que no hace falta un comando de seed aparte y el
  // catálogo está siempre presente, también en los tests e2e.
  async onModuleInit() {
    const cursos = await this.prisma.curso.createMany({
      data: CURSOS,
      skipDuplicates: true,
    });
    const asignaturas = await this.prisma.asignatura.createMany({
      data: ASIGNATURAS,
      skipDuplicates: true,
    });
    if (cursos.count > 0 || asignaturas.count > 0) {
      this.registro.log(
        `Catálogo LOMLOE cargado: ${cursos.count} cursos y ${asignaturas.count} asignaturas nuevas`,
      );
    }
  }

  listarCursos() {
    return this.prisma.curso.findMany({
      orderBy: [{ etapa: 'asc' }, { numero: 'asc' }],
    });
  }

  // Oficiales del curso sin comunidad + la lengua propia de la comunidad
  // indicada + las optativas que haya añadido el propio usuario.
  async listarAsignaturas(
    usuarioId: string,
    cursoId: string,
    comunidad?: ComunidadAutonoma,
  ) {
    await this.obtenerCurso(cursoId);
    return this.prisma.asignatura.findMany({
      where: {
        cursoId,
        OR: [
          { usuarioId: null, comunidad: null },
          ...(comunidad ? [{ usuarioId: null, comunidad }] : []),
          { usuarioId },
        ],
      },
      orderBy: [{ categoria: 'asc' }, { modalidad: 'asc' }, { nombre: 'asc' }],
    });
  }

  async crearOptativaPropia(
    usuarioId: string,
    datos: CrearAsignaturaPropiaDto,
  ) {
    await this.obtenerCurso(datos.cursoId);
    return this.prisma.asignatura.create({
      data: {
        nombre: datos.nombre.trim(),
        categoria: CategoriaAsignatura.OPTATIVA,
        cursoId: datos.cursoId,
        usuarioId,
      },
    });
  }

  async eliminarOptativaPropia(usuarioId: string, id: string) {
    const asignatura = await this.prisma.asignatura.findUnique({
      where: { id },
    });
    if (!asignatura) {
      throw new NotFoundException('Asignatura no encontrada');
    }
    if (asignatura.usuarioId !== usuarioId) {
      // Las oficiales (usuarioId null) y las de otros usuarios no se tocan.
      throw new ForbiddenException(
        'Solo se pueden borrar las asignaturas añadidas por ti',
      );
    }
    await this.prisma.asignatura.delete({ where: { id } });
  }

  private async obtenerCurso(cursoId: string) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }
    return curso;
  }
}
