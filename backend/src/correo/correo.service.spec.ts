import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CorreoService } from './correo.service.js';

const transportadorFalso = {
  sendMail: vi.fn(),
};

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => transportadorFalso),
  },
}));

describe('CorreoService', () => {
  let servicio: CorreoService;

  const configFalso = {
    get: vi.fn((clave: string) => {
      const valores: Record<string, string> = {
        SMTP_HOST: 'smtp.ejemplo.com',
        SMTP_PORT: '587',
        SMTP_USER: 'usuario',
        SMTP_PASS: 'secreto',
        SMTP_FROM: 'FocusFlow <no-reply@focusflow.local>',
      };
      return valores[clave];
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    configFalso.get.mockImplementation((clave: string) => {
      const valores: Record<string, string> = {
        SMTP_HOST: 'smtp.ejemplo.com',
        SMTP_PORT: '587',
        SMTP_USER: 'usuario',
        SMTP_PASS: 'secreto',
        SMTP_FROM: 'FocusFlow <no-reply@focusflow.local>',
      };
      return valores[clave];
    });

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [CorreoService, { provide: ConfigService, useValue: configFalso }],
    }).compile();

    servicio = modulo.get(CorreoService);
  });

  it('rechaza enviar el correo si no hay SMTP_HOST configurado', async () => {
    configFalso.get.mockReturnValue(undefined);

    await expect(
      servicio.enviarCorreoConfirmacionConsentimiento('tutor@ejemplo.com', 'https://enlace'),
    ).rejects.toThrow(BadRequestException);
    expect(transportadorFalso.sendMail).not.toHaveBeenCalled();
  });

  it('envía el correo de confirmación con el destinatario y el enlace correctos', async () => {
    await servicio.enviarCorreoConfirmacionConsentimiento('tutor@ejemplo.com', 'https://enlace/confirmar');

    expect(transportadorFalso.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'tutor@ejemplo.com',
        subject: expect.stringContaining('Confirma'),
        html: expect.stringContaining('https://enlace/confirmar'),
      }),
    );
  });
});
