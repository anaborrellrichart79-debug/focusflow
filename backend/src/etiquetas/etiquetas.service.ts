import { Injectable } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/prisma.service.js';

@Injectable()
export class EtiquetasService {
  constructor(private readonly prisma: ServicioPrisma) {}

  listarPorUsuario(usuarioId: string) {
    return this.prisma.etiqueta.findMany({
      where: { usuarioId },
      orderBy: { nombre: 'asc' },
    });
  }
}
