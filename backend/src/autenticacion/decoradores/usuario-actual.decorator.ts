import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioPeticion } from '../interfaces/carga-util-jwt.interface.js';

// Fábrica exportada aparte (en vez de inline en createParamDecorator) para
// poder probarla como una función normal, sin necesitar un ExecutionContext
// real de Nest: https://docs.nestjs.com/custom-decorators#testing
export function obtenerUsuarioActual(
  _datos: unknown,
  contexto: ExecutionContext,
): UsuarioPeticion {
  const peticion = contexto.switchToHttp().getRequest<Request>();
  return peticion.user as UsuarioPeticion;
}

export const UsuarioActual = createParamDecorator(obtenerUsuarioActual);
