import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class CorreoService {
  constructor(private readonly config: ConfigService) {}

  estaConfigurado() {
    return Boolean(this.config.get('SMTP_HOST'));
  }

  private crearTransportador() {
    if (!this.config.get('SMTP_HOST')) {
      throw new BadRequestException('El envío de correo no está configurado en el servidor');
    }

    return nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')) || 587,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async enviarCorreoConfirmacionConsentimiento(destinatario: string, enlaceConfirmacion: string) {
    const transportador = this.crearTransportador();

    await transportador.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: destinatario,
      subject: 'Confirma el acceso de tu hijo/a a FocusFlow',
      html: `
        <p>Un menor a tu cargo ha creado una cuenta en FocusFlow, una aplicación de organización de tareas.</p>
        <p>Para autorizar su uso, confirma pulsando este enlace:</p>
        <p><a href="${enlaceConfirmacion}">${enlaceConfirmacion}</a></p>
        <p>Si no reconoces esta solicitud, puedes ignorar este correo.</p>
      `,
    });
  }

  async enviarAviso(destinatario: string, asunto: string, html: string) {
    const transportador = this.crearTransportador();

    await transportador.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: destinatario,
      subject: asunto,
      html,
    });
  }
}
