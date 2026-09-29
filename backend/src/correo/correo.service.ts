import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Idioma } from '../comun/idiomas.js';

const TEXTOS_CONSENTIMIENTO: Record<Idioma, { asunto: string; intro: string; confirmar: string; ignorar: string }> = {
  es: {
    asunto: 'Confirma el acceso de tu hijo/a a FocusFlow',
    intro: 'Un menor a tu cargo ha creado una cuenta en FocusFlow, una aplicación de organización de tareas.',
    confirmar: 'Para autorizar su uso, confirma pulsando este enlace:',
    ignorar: 'Si no reconoces esta solicitud, puedes ignorar este correo.',
  },
  en: {
    asunto: 'Confirm your child’s access to FocusFlow',
    intro: 'A minor in your care has created an account on FocusFlow, a task organisation app.',
    confirmar: 'To authorise its use, confirm by clicking this link:',
    ignorar: 'If you don’t recognise this request, you can ignore this email.',
  },
  ca: {
    asunto: 'Confirma l’accés del teu fill/a a FocusFlow',
    intro: 'Un menor al teu càrrec ha creat un compte a FocusFlow, una aplicació d’organització de tasques.',
    confirmar: 'Per autoritzar-ne l’ús, confirma-ho fent clic en aquest enllaç:',
    ignorar: 'Si no reconeixes aquesta sol·licitud, pots ignorar aquest correu.',
  },
  va: {
    asunto: 'Confirma l’accés del teu fill/a a FocusFlow',
    intro: 'Un menor al teu càrrec ha creat un compte en FocusFlow, una aplicació d’organització de tasques.',
    confirmar: 'Per a autoritzar-ne l’ús, confirma-ho fent clic en este enllaç:',
    ignorar: 'Si no reconeixes esta sol·licitud, pots ignorar este correu.',
  },
  gl: {
    asunto: 'Confirma o acceso do teu fillo/a a FocusFlow',
    intro: 'Un menor ao teu cargo creou unha conta en FocusFlow, unha aplicación de organización de tarefas.',
    confirmar: 'Para autorizar o seu uso, confirma premendo esta ligazón:',
    ignorar: 'Se non recoñeces esta solicitude, podes ignorar este correo.',
  },
  eu: {
    asunto: 'Berretsi zure seme-alabak FocusFlow erabiltzeko baimena',
    intro: 'Zure ardurapeko adingabe batek kontu bat sortu du FocusFlow-en, zereginak antolatzeko aplikazio batean.',
    confirmar: 'Erabiltzeko baimena emateko, berretsi esteka hau sakatuta:',
    ignorar: 'Eskaera hau ezagutzen ez baduzu, mezu hau alde batera utz dezakezu.',
  },
};

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

  // En el idioma que eligió el menor al registrarse: es lo más probable en su
  // casa, y el enlace lleva a la app, donde se puede cambiar.
  async enviarCorreoConfirmacionConsentimiento(
    destinatario: string,
    enlaceConfirmacion: string,
    idioma: Idioma = 'es',
  ) {
    const transportador = this.crearTransportador();
    const t = TEXTOS_CONSENTIMIENTO[idioma];

    await transportador.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to: destinatario,
      subject: t.asunto,
      html: `
        <p>${t.intro}</p>
        <p>${t.confirmar}</p>
        <p><a href="${enlaceConfirmacion}">${enlaceConfirmacion}</a></p>
        <p>${t.ignorar}</p>
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
