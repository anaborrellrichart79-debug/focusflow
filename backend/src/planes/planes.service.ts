import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calcularEdad } from '../comun/edad.util.js';
import type { TipoUsoIa } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';

const LIMITE_MENSUAL_POR_DEFECTO = 100;

// Consejos para contratar el Plus (ventana al iniciar sesión y avisos en el
// momento justo). Cada uno se enseña una sola vez por cuenta.
export const CONSEJOS_PLUS = ['oferta-inicio', 'horario', 'examenes', 'deberes', 'pasos', 'plan-estudio'] as const;
export type ConsejoPlus = (typeof CONSEJOS_PLUS)[number];

// Oferta de lanzamiento del Plus: vigente hasta OFERTA_PLUS_HASTA (AAAA-MM-DD,
// incluido). Sin la variable, no hay oferta. Tiene que ser una oferta de
// verdad y con fecha de fin: anunciar como oferta el precio de siempre sería
// publicidad engañosa.
export function ofertaPlusHasta(config: ConfigService, ahora = new Date()): string | null {
  const hasta = config.get<string>('OFERTA_PLUS_HASTA');
  if (!hasta || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) return null;
  return ahora <= new Date(`${hasta}T23:59:59`) ? hasta : null;
}

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
    const [usuario, origen, usados, cuentas, suscripcion] = await Promise.all([
      this.leerUsuario(usuarioId),
      this.origenIa(usuarioId),
      this.usosDelMes(usuarioId),
      this.tamanoBolsa(usuarioId),
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          fechaNacimiento: true,
          plusCortesia: true,
          estadoSuscripcion: true,
          plusHasta: true,
          bajaAlFinalDelPeriodo: true,
          consejosPlusVistos: true,
        },
      }),
    ]);
    // Sin fecha de nacimiento = cuenta antigua, que se trata como adulta.
    const adulta = !suscripcion?.fechaNacimiento || calcularEdad(suscripcion.fechaNacimiento) >= 18;
    return {
      incluida: origen !== null,
      origen,
      // Para explicar por qué no hay IA en vez de ofrecer el plan Plus.
      desactivadaPorFamilia: usuario?.iaDesactivadaPorFamilia ?? false,
      usados,
      limite: this.limiteMensual(),
      // Si los usos se comparten con otras cuentas vinculadas (la bolsa).
      compartidos: cuentas > 1,
      // Suscripción de Stripe (solo con Plus propio pagado).
      cortesia: suscripcion?.plusCortesia ?? false,
      plusHasta: suscripcion?.plusHasta ?? null,
      bajaAlFinalDelPeriodo: suscripcion?.bajaAlFinalDelPeriodo ?? false,
      pagoPendiente: suscripcion?.estadoSuscripcion === 'past_due',
      // Puede pagar: adulta y sin IA por ningún lado. A los menores no se les
      // ofrece (no pueden pagar) ni se les enseñan los consejos de venta.
      puedeContratar: adulta && origen === null && !usuario?.iaDesactivadaPorFamilia,
      consejosVistos: suscripcion?.consejosPlusVistos ?? [],
      ofertaHasta: ofertaPlusHasta(this.config),
      // El código de promoción de la oferta (creado en Stripe), para decirlo.
      ofertaCodigo: ofertaPlusHasta(this.config) ? (this.config.get<string>('OFERTA_PLUS_CODIGO') ?? null) : null,
    };
  }

  // El consejo ya se ha enseñado (o lo han cerrado): no vuelve a salir.
  async marcarConsejoVisto(usuarioId: string, consejo: string) {
    if (!(CONSEJOS_PLUS as readonly string[]).includes(consejo)) {
      throw new BadRequestException('Ese consejo no existe');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { consejosPlusVistos: true },
    });
    if (!usuario || usuario.consejosPlusVistos.includes(consejo)) return;
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { consejosPlusVistos: { push: consejo } },
    });
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
