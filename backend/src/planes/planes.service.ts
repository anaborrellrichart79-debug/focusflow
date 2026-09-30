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
  // null si no la tiene (tampoco si su familia la ha apagado).
  async origenIa(usuarioId: string): Promise<'PROPIO' | 'FAMILIA' | null> {
    const usuario = await this.leerUsuario(usuarioId);
    if (!usuario || usuario.iaDesactivadaPorFamilia) return null;
    if (usuario.plan === 'PAGO') return 'PROPIO';
    if (usuario.vinculosComoSupervisado.some((vinculo) => vinculo.responsable.plan === 'PAGO')) return 'FAMILIA';
    return null;
  }

  private leerUsuario(usuarioId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        plan: true,
        iaDesactivadaPorFamilia: true,
        vinculosComoSupervisado: { select: { responsable: { select: { id: true, plan: true } } } },
      },
    });
  }

  // Quién paga la IA de esta cuenta: ella misma si tiene Plus, o el primer
  // adulto vinculado que lo tenga. null si no tiene IA.
  private async quienPaga(usuarioId: string): Promise<string | null> {
    const usuario = await this.leerUsuario(usuarioId);
    if (!usuario || usuario.iaDesactivadaPorFamilia) return null;
    if (usuario.plan === 'PAGO') return usuarioId;
    return usuario.vinculosComoSupervisado.find((vinculo) => vinculo.responsable.plan === 'PAGO')?.responsable.id ?? null;
  }

  // Cuentas que comparten la bolsa de usos de una suscripción: quien paga y
  // todas las que tiene vinculadas. Como no se puede comprobar que sean de
  // verdad familia, cuantas más se vinculan, menos le toca a cada una: así el
  // coste de la IA por suscripción nunca pasa del límite.
  private async grupoDe(pagadorId: string) {
    const vinculos = await this.prisma.vinculoFamiliar.findMany({
      where: { responsableId: pagadorId },
      select: { supervisadoId: true },
    });
    return [pagadorId, ...vinculos.map((vinculo) => vinculo.supervisadoId)];
  }

  async tieneIa(usuarioId: string) {
    return (await this.origenIa(usuarioId)) !== null;
  }

  limiteMensual() {
    return Number(this.config.get('IA_LIMITE_MENSUAL')) || LIMITE_MENSUAL_POR_DEFECTO;
  }

  // Usos del mes natural en curso de toda la bolsa (quien paga y sus
  // vinculados); sin IA, solo los de la propia cuenta. Hora del servidor: un
  // día de desfase a final de mes no importa para un límite así.
  async usosDelMes(usuarioId: string, ahora = new Date()) {
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const pagador = await this.quienPaga(usuarioId);
    const cuentas = pagador ? await this.grupoDe(pagador) : [usuarioId];
    return this.prisma.usoIa.count({ where: { usuarioId: { in: cuentas }, creadoEn: { gte: inicioMes } } });
  }

  // Cuántas cuentas comparten la bolsa (1 = nadie más).
  private async tamanoBolsa(usuarioId: string) {
    const pagador = await this.quienPaga(usuarioId);
    return pagador ? (await this.grupoDe(pagador)).length : 1;
  }

  async estadoIa(usuarioId: string) {
    const [usuario, origen, usados, cuentas] = await Promise.all([
      this.leerUsuario(usuarioId),
      this.origenIa(usuarioId),
      this.usosDelMes(usuarioId),
      this.tamanoBolsa(usuarioId),
    ]);
    return {
      incluida: origen !== null,
      origen,
      // Para explicar por qué no hay IA en vez de ofrecer el plan Plus.
      desactivadaPorFamilia: usuario?.iaDesactivadaPorFamilia ?? false,
      usados,
      limite: this.limiteMensual(),
      // Si los usos se comparten con otras cuentas vinculadas (la bolsa).
      compartidos: cuentas > 1,
    };
  }

  // Antes de pedir nada a la IA desde el asistente: sin plan, 403; con el
  // límite del mes gastado, 429.
  async comprobarUsoIa(usuarioId: string) {
    if ((await this.leerUsuario(usuarioId))?.iaDesactivadaPorFamilia) {
      throw new ForbiddenException('Tu familia ha desactivado la ayuda de la IA');
    }
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
