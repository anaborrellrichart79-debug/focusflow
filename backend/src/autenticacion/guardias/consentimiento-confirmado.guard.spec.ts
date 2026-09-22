import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GuardaConsentimientoConfirmado } from './consentimiento-confirmado.guard.js';

function crearContextoFalso(usuarioId: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: usuarioId } }),
    }),
  } as unknown as ExecutionContext;
}

describe('GuardaConsentimientoConfirmado', () => {
  it('deja pasar si el usuario tiene el consentimiento confirmado', async () => {
    const prismaFalso = {
      usuario: { findUnique: vi.fn().mockResolvedValue({ consentimientoConfirmado: true }) },
    };
    const guarda = new GuardaConsentimientoConfirmado(prismaFalso as never);

    await expect(guarda.canActivate(crearContextoFalso('usuario-1'))).resolves.toBe(true);
  });

  it('bloquea si el usuario no tiene el consentimiento confirmado', async () => {
    const prismaFalso = {
      usuario: { findUnique: vi.fn().mockResolvedValue({ consentimientoConfirmado: false }) },
    };
    const guarda = new GuardaConsentimientoConfirmado(prismaFalso as never);

    await expect(guarda.canActivate(crearContextoFalso('usuario-menor'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deja pasar si el usuario ya no existe (evita romper otras comprobaciones posteriores)', async () => {
    const prismaFalso = {
      usuario: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const guarda = new GuardaConsentimientoConfirmado(prismaFalso as never);

    await expect(guarda.canActivate(crearContextoFalso('usuario-borrado'))).resolves.toBe(true);
  });
});
