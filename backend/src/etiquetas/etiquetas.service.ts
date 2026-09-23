import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type {
  ActualizarEtiquetaDto,
  CrearEtiquetaDto,
} from './dto/etiquetas.dto.js';

// Etiqueta › subetiqueta › sub-subetiqueta (p. ej. Matemáticas › Cálculo ›
// Integrales). Dos se quedaban cortos para ESO y Bachillerato; sin límite, la
// jerarquía se volvía difícil de manejar.
export const MAXIMO_NIVELES_ETIQUETA = 3;

interface NodoEtiqueta {
  id: string;
  padreId: string | null;
}

@Injectable()
export class EtiquetasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  listarPorUsuario(usuarioId: string) {
    return this.prisma.etiqueta.findMany({
      where: { usuarioId },
      orderBy: { nombre: 'asc' },
    });
  }

  async crear(usuarioId: string, datos: CrearEtiquetaDto) {
    const nombre = datos.nombre.trim();
    if (datos.padreId) {
      const arbol = await this.cargarArbol(usuarioId);
      if (!arbol.has(datos.padreId))
        throw new NotFoundException('Etiqueta no encontrada');
      if (this.nivel(arbol, datos.padreId) + 1 > MAXIMO_NIVELES_ETIQUETA) {
        throw new BadRequestException(
          `Las etiquetas pueden tener como mucho ${MAXIMO_NIVELES_ETIQUETA} niveles`,
        );
      }
    }
    await this.comprobarNombreLibre(usuarioId, nombre);
    return this.prisma.etiqueta.create({
      data: { nombre, padreId: datos.padreId ?? null, usuarioId },
    });
  }

  async actualizar(
    usuarioId: string,
    id: string,
    datos: ActualizarEtiquetaDto,
  ) {
    const arbol = await this.cargarArbol(usuarioId);
    if (!arbol.has(id)) throw new NotFoundException('Etiqueta no encontrada');

    if (datos.padreId !== undefined && datos.padreId !== null) {
      if (!arbol.has(datos.padreId))
        throw new NotFoundException('Etiqueta no encontrada');
      if (
        datos.padreId === id ||
        this.esDescendiente(arbol, datos.padreId, id)
      ) {
        throw new BadRequestException(
          'Una etiqueta no puede ir dentro de sí misma',
        );
      }
      // Se mueve con todo lo que cuelga de ella: tiene que caber entero.
      if (
        this.nivel(arbol, datos.padreId) + this.altura(arbol, id) >
        MAXIMO_NIVELES_ETIQUETA
      ) {
        throw new BadRequestException(
          `Las etiquetas pueden tener como mucho ${MAXIMO_NIVELES_ETIQUETA} niveles`,
        );
      }
    }

    const nombre = datos.nombre?.trim();
    if (nombre) await this.comprobarNombreLibre(usuarioId, nombre, id);

    return this.prisma.etiqueta.update({
      where: { id },
      data: { nombre, padreId: datos.padreId },
    });
  }

  // Las subetiquetas no se pierden: suben un nivel (pasan a colgar del padre
  // de la eliminada). Las tareas solo pierden esta etiqueta.
  async eliminar(usuarioId: string, id: string) {
    const etiqueta = await this.prisma.etiqueta.findFirst({
      where: { id, usuarioId },
    });
    if (!etiqueta) throw new NotFoundException('Etiqueta no encontrada');

    await this.prisma.$transaction([
      this.prisma.etiqueta.updateMany({
        where: { padreId: id, usuarioId },
        data: { padreId: etiqueta.padreId },
      }),
      this.prisma.etiqueta.delete({ where: { id } }),
    ]);
  }

  private async cargarArbol(usuarioId: string) {
    const etiquetas = await this.prisma.etiqueta.findMany({
      where: { usuarioId },
      select: { id: true, padreId: true },
    });
    return new Map<string, NodoEtiqueta>(etiquetas.map((e) => [e.id, e]));
  }

  // 1 para una etiqueta sin padre.
  private nivel(arbol: Map<string, NodoEtiqueta>, id: string): number {
    let nivel = 1;
    let actual = arbol.get(id);
    while (actual?.padreId && nivel <= MAXIMO_NIVELES_ETIQUETA + 1) {
      nivel += 1;
      actual = arbol.get(actual.padreId);
    }
    return nivel;
  }

  // Niveles que ocupa la etiqueta con todo lo que cuelga de ella (1 si no tiene hijas).
  private altura(arbol: Map<string, NodoEtiqueta>, id: string): number {
    const hijas = [...arbol.values()].filter((nodo) => nodo.padreId === id);
    return 1 + Math.max(0, ...hijas.map((hija) => this.altura(arbol, hija.id)));
  }

  private esDescendiente(
    arbol: Map<string, NodoEtiqueta>,
    posibleDescendiente: string,
    ancestro: string,
  ) {
    let actual = arbol.get(posibleDescendiente);
    while (actual?.padreId) {
      if (actual.padreId === ancestro) return true;
      actual = arbol.get(actual.padreId);
    }
    return false;
  }

  private async comprobarNombreLibre(
    usuarioId: string,
    nombre: string,
    excepto?: string,
  ) {
    const existente = await this.prisma.etiqueta.findUnique({
      where: { usuarioId_nombre: { usuarioId, nombre } },
    });
    if (existente && existente.id !== excepto) {
      throw new ConflictException('Ya tienes una etiqueta con ese nombre');
    }
  }
}
