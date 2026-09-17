import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioPeticion } from '../interfaces/carga-util-jwt.interface.js';

export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): UsuarioPeticion => {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    return peticion.user as UsuarioPeticion;
  },
);
