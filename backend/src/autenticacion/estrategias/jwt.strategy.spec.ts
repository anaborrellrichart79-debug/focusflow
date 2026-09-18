import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { EstrategiaJwt } from './jwt.strategy.js';

function crearConfigServiceFalso() {
  const getOrThrow = vi.fn().mockReturnValue('secreto-de-prueba');
  return { getOrThrow, configService: { getOrThrow } as unknown as ConfigService };
}

describe('EstrategiaJwt', () => {
  it('lee JWT_SECRET del ConfigService al construirse (falla rápido si no está configurado)', () => {
    const { getOrThrow, configService } = crearConfigServiceFalso();

    new EstrategiaJwt(configService);

    expect(getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('validate mapea "sub" a "id" y conserva el correo, sin exponer más campos de la carga útil', () => {
    const estrategia = new EstrategiaJwt(crearConfigServiceFalso().configService);

    const resultado = estrategia.validate({ sub: 'usuario-1', correo: 'ana@example.com' });

    expect(resultado).toEqual({ id: 'usuario-1', correo: 'ana@example.com' });
  });
});
