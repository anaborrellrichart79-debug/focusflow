import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { calcularEdad } from '../comun/edad.util.js';
import { ofertaPlusHasta } from '../planes/planes.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';

export const CLIENTE_STRIPE = Symbol('CLIENTE_STRIPE');

export type PeriodoPlus = 'MENSUAL' | 'ANUAL';

const VARIABLE_PRECIO: Record<PeriodoPlus, string> = {
  MENSUAL: 'STRIPE_PRECIO_MENSUAL',
  ANUAL: 'STRIPE_PRECIO_ANUAL',
};

// Estados de la suscripción con los que se tiene Plus. past_due: el cobro de
// la renovación ha fallado y Stripe lo está reintentando; mientras tanto se
// conserva. Si todos los reintentos fallan, Stripe la pasa a canceled o unpaid.
const ESTADOS_CON_PLUS = new Set<string>(['active', 'trialing', 'past_due']);

// Stripe Checkout no tiene valenciano, catalán, gallego ni vasco: castellano.
const IDIOMA_STRIPE: Record<string, 'es' | 'en'> = { es: 'es', va: 'es', ca: 'es', gl: 'es', eu: 'es', en: 'en' };

// Texto bajo el botón de pagar, en el idioma de la cuenta (Markdown de Stripe).
function textoCondiciones(idioma: string, web: string) {
  const textos: Record<string, string> = {
    es: `Al suscribirte aceptas las [condiciones del servicio](${web}/condiciones). Puedes darte de baja cuando quieras desde Ajustes.`,
    va: `En subscriure't acceptes les [condicions del servei](${web}/condiciones). Pots donar-te de baixa quan vulgues des d'Ajustos.`,
    ca: `En subscriure't acceptes les [condicions del servei](${web}/condiciones). Pots donar-te de baixa quan vulguis des d'Ajustos.`,
    gl: `Ao subscribirte aceptas as [condicións do servizo](${web}/condiciones). Podes darte de baixa cando queiras desde Axustes.`,
    eu: `Harpidetzean [zerbitzuaren baldintzak](${web}/condiciones) onartzen dituzu. Nahi duzunean eman dezakezu baja Ezarpenetatik.`,
    en: `By subscribing you accept the [terms of service](${web}/condiciones). You can cancel at any time from Settings.`,
  };
  return textos[idioma] ?? textos.es;
}

// Cobro del plan Plus con Stripe: Checkout para contratar, el portal de
// cliente para darse de baja, cambiar la tarjeta o ver las facturas, y el
// webhook, que es lo único que cambia Usuario.plan. PlanesService sigue
// leyendo solo `plan`, así que el bloqueo de la IA no cambia.
@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly config: ConfigService,
    @Inject(CLIENTE_STRIPE) private readonly stripe: Stripe | null,
  ) {}

  private cliente() {
    if (!this.stripe) throw new ServiceUnavailableException('Los pagos no están configurados en el servidor');
    return this.stripe;
  }

  private web() {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  }

  async crearCheckout(usuarioId: string, periodo: PeriodoPlus) {
    const stripe = this.cliente();
    const precio = this.config.get<string>(VARIABLE_PRECIO[periodo]);
    if (!precio) throw new ServiceUnavailableException('Los pagos no están configurados en el servidor');

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        correo: true,
        nombre: true,
        idioma: true,
        fechaNacimiento: true,
        correoVerificado: true,
        plan: true,
        stripeClienteId: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    // Sin fecha de nacimiento = cuenta de antes del modo escolar, que se
    // trata como adulta (igual que en el consentimiento parental).
    if (usuario.fechaNacimiento && calcularEdad(usuario.fechaNacimiento) < 18) {
      throw new ForbiddenException('Solo una persona adulta puede contratar el plan Plus');
    }
    if (!usuario.correoVerificado) {
      throw new ForbiddenException('Verifica tu correo antes de contratar el plan Plus');
    }
    if (usuario.plan === 'PAGO') throw new BadRequestException('Ya tienes el plan Plus');

    const idioma = IDIOMA_STRIPE[usuario.idioma] ?? 'es';
    let clienteId = usuario.stripeClienteId;
    if (!clienteId) {
      const clienteStripe = await stripe.customers.create({
        email: usuario.correo,
        name: usuario.nombre ?? undefined,
        preferred_locales: [idioma],
        metadata: { usuarioId },
      });
      clienteId = clienteStripe.id;
      await this.prisma.usuario.update({ where: { id: usuarioId }, data: { stripeClienteId: clienteId } });
    }

    const sesion = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: clienteId,
      client_reference_id: usuarioId,
      line_items: [{ price: precio, quantity: 1 }],
      subscription_data: { metadata: { usuarioId } },
      locale: idioma,
      // El campo para el código de la oferta, solo mientras esté vigente.
      allow_promotion_codes: ofertaPlusHasta(this.config) !== null,
      custom_text: { submit: { message: textoCondiciones(usuario.idioma, this.web()) } },
      integration_identifier: 'focusflow-plus-qkvwmzrt',
      success_url: `${this.web()}/ajustes?pago=ok`,
      cancel_url: `${this.web()}/ajustes?pago=cancelado`,
    });
    if (!sesion.url) throw new ServiceUnavailableException('Los pagos no están configurados en el servidor');
    return { url: sesion.url };
  }

  async crearPortal(usuarioId: string) {
    const stripe = this.cliente();
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { stripeClienteId: true, idioma: true },
    });
    if (!usuario?.stripeClienteId) throw new BadRequestException('No tienes ninguna suscripción');
    const sesion = await stripe.billingPortal.sessions.create({
      customer: usuario.stripeClienteId,
      locale: IDIOMA_STRIPE[usuario.idioma] ?? 'es',
      return_url: `${this.web()}/ajustes`,
    });
    return { url: sesion.url };
  }

  // Aviso de Stripe. Se comprueba la firma con el cuerpo tal cual llegó (por
  // eso main.ts guarda rawBody) y se vuelve a leer la suscripción de Stripe:
  // así da igual que un aviso llegue repetido o fuera de orden.
  async procesarWebhook(cuerpo: Buffer | undefined, firma: string | undefined) {
    const stripe = this.cliente();
    const secreto = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secreto) throw new ServiceUnavailableException('Los pagos no están configurados en el servidor');
    let evento: Stripe.Event;
    try {
      if (!cuerpo || !firma) throw new Error('Falta el cuerpo o la firma');
      evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
    } catch {
      throw new BadRequestException('La firma del aviso de Stripe no es válida');
    }

    switch (evento.type) {
      case 'checkout.session.completed': {
        const sesion = evento.data.object;
        if (sesion.mode === 'subscription' && sesion.subscription) {
          const id = typeof sesion.subscription === 'string' ? sesion.subscription : sesion.subscription.id;
          await this.sincronizarSuscripcion(id);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.sincronizarSuscripcion(evento.data.object.id);
        break;
    }
  }

  async sincronizarSuscripcion(suscripcionId: string) {
    const suscripcion = await this.cliente().subscriptions.retrieve(suscripcionId);
    const clienteId = typeof suscripcion.customer === 'string' ? suscripcion.customer : suscripcion.customer.id;
    const usuarioIdMetadatos = suscripcion.metadata?.usuarioId;
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ stripeClienteId: clienteId }, ...(usuarioIdMetadatos ? [{ id: usuarioIdMetadatos }] : [])],
      },
      select: { id: true, plusCortesia: true, stripeSuscripcionId: true, estadoSuscripcion: true },
    });
    // La cuenta se ha borrado (y su suscripción se canceló al borrarla).
    if (!usuario) return;

    const conPlus = ESTADOS_CON_PLUS.has(suscripcion.status);
    // Si la cuenta ya tiene otra suscripción con Plus, el aviso de una
    // antigua que se cancela no le quita nada.
    if (
      !conPlus &&
      usuario.stripeSuscripcionId &&
      usuario.stripeSuscripcionId !== suscripcion.id &&
      usuario.estadoSuscripcion &&
      ESTADOS_CON_PLUS.has(usuario.estadoSuscripcion)
    ) {
      return;
    }

    const finPeriodo = Math.max(0, ...suscripcion.items.data.map((elemento) => elemento.current_period_end));
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        stripeClienteId: clienteId,
        stripeSuscripcionId: suscripcion.id,
        estadoSuscripcion: suscripcion.status,
        plusHasta: finPeriodo ? new Date(finPeriodo * 1000) : null,
        bajaAlFinalDelPeriodo: conPlus && (suscripcion.cancel_at_period_end || suscripcion.cancel_at !== null),
        plan: conPlus || usuario.plusCortesia ? 'PAGO' : 'GRATUITO',
      },
    });
  }

  // Al eliminar la cuenta, antes de borrarla: que no se siga cobrando. Si
  // Stripe falla, no se borra la cuenta (se perdería la relación con la
  // suscripción y se seguiría cobrando).
  async cancelarSuscripcionAlEliminar(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { stripeSuscripcionId: true, estadoSuscripcion: true },
    });
    if (!usuario?.stripeSuscripcionId) return;
    if (usuario.estadoSuscripcion && ['canceled', 'incomplete_expired'].includes(usuario.estadoSuscripcion)) return;
    if (!this.stripe) {
      throw new ServiceUnavailableException('No se ha podido cancelar tu suscripción; inténtalo de nuevo o escríbenos');
    }
    try {
      await this.stripe.subscriptions.cancel(usuario.stripeSuscripcionId);
    } catch (error) {
      // Ya estaba cancelada en Stripe: no hay nada que cobrar.
      if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing') return;
      console.error('No se pudo cancelar la suscripción de Stripe al eliminar una cuenta', error);
      throw new ServiceUnavailableException(
        'No se ha podido cancelar tu suscripción; inténtalo de nuevo o escríbenos',
      );
    }
  }
}
