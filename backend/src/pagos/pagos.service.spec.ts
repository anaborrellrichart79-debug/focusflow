import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import { CLIENTE_STRIPE, PagosService } from './pagos.service.js';

function suscripcion(estado: string, extra: Record<string, unknown> = {}) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status: estado,
    metadata: { usuarioId: 'laura' },
    cancel_at_period_end: false,
    cancel_at: null,
    items: { data: [{ current_period_end: 1_793_000_000 }] },
    ...extra,
  };
}

describe('PagosService', () => {
  let servicio: PagosService;
  const prismaFalso = {
    usuario: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  };
  const variables: Record<string, string | undefined> = {};
  const configFalso = { get: vi.fn((clave: string) => variables[clave]) };
  const stripeFalso = {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    subscriptions: { retrieve: vi.fn(), cancel: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  };

  async function crear(stripe: unknown = stripeFalso) {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: ServicioPrisma, useValue: prismaFalso },
        { provide: ConfigService, useValue: configFalso },
        { provide: CLIENTE_STRIPE, useValue: stripe },
      ],
    }).compile();
    return modulo.get(PagosService);
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    for (const clave of Object.keys(variables)) delete variables[clave];
    Object.assign(variables, {
      STRIPE_PRECIO_MENSUAL: 'price_mes',
      STRIPE_PRECIO_ANUAL: 'price_anio',
      STRIPE_WEBHOOK_SECRET: 'whsec_1',
      FRONTEND_URL: 'https://focusflowup.com',
    });
    stripeFalso.customers.create.mockResolvedValue({ id: 'cus_nuevo' });
    stripeFalso.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/c/1' });
    servicio = await crear();
  });

  describe('contratar (Checkout)', () => {
    const adulta = {
      correo: 'laura@example.com',
      nombre: 'Laura',
      idioma: 'va',
      fechaNacimiento: new Date('1990-01-01'),
      correoVerificado: true,
      plan: 'GRATUITO',
      stripeClienteId: null,
    };

    it('crea el cliente y la sesión con el precio anual', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue(adulta);

      expect(await servicio.crearCheckout('laura', 'ANUAL')).toEqual({ url: 'https://checkout.stripe.com/c/1' });
      expect(stripeFalso.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'laura@example.com', metadata: { usuarioId: 'laura' } }),
      );
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'laura' },
        data: { stripeClienteId: 'cus_nuevo' },
      });
      const parametros = stripeFalso.checkout.sessions.create.mock.calls[0][0];
      expect(parametros).toMatchObject({
        mode: 'subscription',
        customer: 'cus_nuevo',
        line_items: [{ price: 'price_anio', quantity: 1 }],
        locale: 'es',
        allow_promotion_codes: false,
        success_url: 'https://focusflowup.com/ajustes?pago=ok',
      });
      expect(parametros).not.toHaveProperty('payment_method_types');
    });

    it('reutiliza el cliente de Stripe que ya tenía', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ ...adulta, stripeClienteId: 'cus_viejo' });
      await servicio.crearCheckout('laura', 'MENSUAL');
      expect(stripeFalso.customers.create).not.toHaveBeenCalled();
      expect(stripeFalso.checkout.sessions.create.mock.calls[0][0]).toMatchObject({
        customer: 'cus_viejo',
        line_items: [{ price: 'price_mes', quantity: 1 }],
      });
    });

    it('un menor no puede pagar', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ ...adulta, fechaNacimiento: new Date('2016-05-01') });
      await expect(servicio.crearCheckout('sofia', 'MENSUAL')).rejects.toBeInstanceOf(ForbiddenException);
      expect(stripeFalso.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('sin el correo verificado no se puede pagar', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ ...adulta, correoVerificado: false });
      await expect(servicio.crearCheckout('laura', 'MENSUAL')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('si ya tiene Plus no se le cobra otra vez', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ ...adulta, plan: 'PAGO' });
      await expect(servicio.crearCheckout('ana', 'MENSUAL')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('con la oferta vigente deja poner el código', async () => {
      variables.OFERTA_PLUS_HASTA = '2999-12-31';
      prismaFalso.usuario.findUnique.mockResolvedValue(adulta);
      await servicio.crearCheckout('laura', 'ANUAL');
      expect(stripeFalso.checkout.sessions.create.mock.calls[0][0].allow_promotion_codes).toBe(true);
    });

    it('sin Stripe configurado responde 503', async () => {
      const sinStripe = await crear(null);
      await expect(sinStripe.crearCheckout('laura', 'MENSUAL')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('webhook', () => {
    function evento(tipo: string, objeto: unknown) {
      stripeFalso.webhooks.constructEvent.mockReturnValue({ type: tipo, data: { object: objeto } });
    }

    beforeEach(() => {
      prismaFalso.usuario.findFirst.mockResolvedValue({
        id: 'laura',
        plusCortesia: false,
        stripeSuscripcionId: null,
        estadoSuscripcion: null,
      });
    });

    it('con una firma que no es válida responde 400 y no toca nada', async () => {
      stripeFalso.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('firma');
      });
      await expect(servicio.procesarWebhook(Buffer.from('{}'), 't=1,v1=x')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    });

    it('sin firma responde 400', async () => {
      await expect(servicio.procesarWebhook(Buffer.from('{}'), undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('pago completado: pasa a Plus con la fecha de renovación', async () => {
      evento('checkout.session.completed', { mode: 'subscription', subscription: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('active'));

      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');

      expect(stripeFalso.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
      expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
        where: { id: 'laura' },
        data: {
          stripeClienteId: 'cus_1',
          stripeSuscripcionId: 'sub_1',
          estadoSuscripcion: 'active',
          plusHasta: new Date(1_793_000_000 * 1000),
          bajaAlFinalDelPeriodo: false,
          plan: 'PAGO',
        },
      });
    });

    it('el mismo aviso repetido deja la cuenta igual', async () => {
      evento('customer.subscription.updated', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('active'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      const [primera, segunda] = prismaFalso.usuario.update.mock.calls;
      expect(segunda).toEqual(primera);
    });

    it('dado de baja: conserva Plus hasta el final del periodo', async () => {
      evento('customer.subscription.updated', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('active', { cancel_at_period_end: true }));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update.mock.calls[0][0].data).toMatchObject({
        plan: 'PAGO',
        bajaAlFinalDelPeriodo: true,
      });
    });

    it('cobro fallido (past_due): sigue con Plus mientras Stripe reintenta', async () => {
      evento('customer.subscription.updated', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('past_due'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update.mock.calls[0][0].data).toMatchObject({
        plan: 'PAGO',
        estadoSuscripcion: 'past_due',
      });
    });

    it('suscripción terminada: vuelve al plan gratuito', async () => {
      evento('customer.subscription.deleted', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('canceled'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update.mock.calls[0][0].data).toMatchObject({
        plan: 'GRATUITO',
        bajaAlFinalDelPeriodo: false,
      });
    });

    it('una cuenta de cortesía no pierde el Plus', async () => {
      prismaFalso.usuario.findFirst.mockResolvedValue({
        id: 'ana',
        plusCortesia: true,
        stripeSuscripcionId: null,
        estadoSuscripcion: null,
      });
      evento('customer.subscription.deleted', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('canceled'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update.mock.calls[0][0].data.plan).toBe('PAGO');
    });

    it('cancelar una suscripción antigua no quita la nueva', async () => {
      prismaFalso.usuario.findFirst.mockResolvedValue({
        id: 'laura',
        plusCortesia: false,
        stripeSuscripcionId: 'sub_nueva',
        estadoSuscripcion: 'active',
      });
      evento('customer.subscription.deleted', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('canceled'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    });

    it('si la cuenta ya no existe, no hace nada', async () => {
      prismaFalso.usuario.findFirst.mockResolvedValue(null);
      evento('customer.subscription.updated', { id: 'sub_1' });
      stripeFalso.subscriptions.retrieve.mockResolvedValue(suscripcion('active'));
      await servicio.procesarWebhook(Buffer.from('{}'), 'firma');
      expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    });
  });

  describe('portal de cliente', () => {
    it('sin suscripción no hay portal', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ stripeClienteId: null, idioma: 'es' });
      await expect(servicio.crearPortal('laura')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('devuelve la URL del portal y vuelve a Ajustes', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ stripeClienteId: 'cus_1', idioma: 'en' });
      stripeFalso.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/p/1' });
      expect(await servicio.crearPortal('laura')).toEqual({ url: 'https://billing.stripe.com/p/1' });
      expect(stripeFalso.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_1',
        locale: 'en',
        return_url: 'https://focusflowup.com/ajustes',
      });
    });
  });

  describe('eliminar la cuenta', () => {
    it('cancela la suscripción activa', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ stripeSuscripcionId: 'sub_1', estadoSuscripcion: 'active' });
      await servicio.cancelarSuscripcionAlEliminar('laura');
      expect(stripeFalso.subscriptions.cancel).toHaveBeenCalledWith('sub_1');
    });

    it('sin suscripción no llama a Stripe', async () => {
      prismaFalso.usuario.findUnique.mockResolvedValue({ stripeSuscripcionId: null, estadoSuscripcion: null });
      await servicio.cancelarSuscripcionAlEliminar('laura');
      expect(stripeFalso.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it('si Stripe falla, avisa para que no se borre la cuenta', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      prismaFalso.usuario.findUnique.mockResolvedValue({ stripeSuscripcionId: 'sub_1', estadoSuscripcion: 'active' });
      stripeFalso.subscriptions.cancel.mockRejectedValueOnce(new Error('sin red'));
      await expect(servicio.cancelarSuscripcionAlEliminar('laura')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
