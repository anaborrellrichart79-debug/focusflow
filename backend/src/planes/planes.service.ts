import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TipoUsoIa } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';

const LIMITE_MENSUAL_POR_DEFECTO = 100;

// Qué incluye el plan de cada cuenta. La IA (asistente de tareas y texto de
// los avisos) solo está en el plan de pago, o para un menor vinculado a un
// adulto que lo tenga (plan familiar). Así, sin ningún usuario de pago, nunca
// se hace una petición a la IA y el gasto es cero.
@Injectable()
export class PlanesService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly config: ConfigService,
  ) {}

  // De dónde le viene la IA: su propio plan, el de un adulto vinculado, o
  // null si no la tiene.
  async origenIa(usuarioId: string): Promise<'PROPIO' | 'FAMILIA' | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        plan: true,
        vinculosComoSupervisado: { select: { responsable: { select: { plan: true } } } },
      },
    });
    if (!usuario) return null;
    if (usuario.plan === 'PAGO') return 'PROPIO';
    if (usuario.vinculosComoSupervisado.some((vinculo) => vinculo.responsable.plan === 'PAGO')) return 'FAMILIA';
    return null;
  }

  async tieneIa(usuarioId: string) {
    return (await this.origenIa(usuarioId)) !== null;
  }

  limiteMensual() {
    return Number(this.config.get('IA_LIMITE_MENSUAL')) || LIMITE_MENSUAL_POR_DEFECTO;
  }

  // Usos del mes natural en curso (hora del servidor; un día de desfase a
  // final de mes no importa para un límite así).
  async usosDelMes(usuarioId: string, ahora = new Date()) {
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return this.prisma.usoIa.count({ where: { usuarioId, creadoEn: { gte: inicioMes } } });
  }

  async estadoIa(usuarioId: string) {
    const [origen, usados] = await Promise.all([this.origenIa(usuarioId), this.usosDelMes(usuarioId)]);
    return { incluida: origen !== null, origen, usados, limite: this.limiteMensual() };
  }

  // Antes de pedir nada a la IA desde el asistente: sin plan, 403; con el
  // límite del mes gastado, 429.
  async comprobarUsoIa(usuarioId: string) {
    if (!(await this.tieneIa(usuarioId))) {
      throw new ForbiddenException('La ayuda de la IA está incluida en el plan Plus');
    }
    if ((await this.usosDelMes(usuarioId)) >= this.limiteMensual()) {
      throw new HttpException('Has llegado al límite de usos de la IA de este mes', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  // Solo cuando la propuesta ha salido bien: un fallo de la IA no gasta usos.
  async registrarUsoIa(usuarioId: string, tipo: TipoUsoIa) {
    await this.prisma.usoIa.create({ data: { usuarioId, tipo } });
  }
}
