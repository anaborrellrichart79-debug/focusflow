import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { codigoDeMensaje, codigoPorEstado } from './errores.js';

// Deja la respuesta de error tal cual la montaría Nest ({ statusCode,
// message, error }) y le añade `codigo`, para que el frontend la traduzca
// (ver errores.ts). Los errores de validación de un DTO traen varios mensajes:
// `codigos` va alineado con `message` (null en los que no están en el catálogo,
// como los genéricos de class-validator).
@Catch(HttpException)
export class FiltroErrores implements ExceptionFilter {
  catch(excepcion: HttpException, host: ArgumentsHost) {
    const estado = excepcion.getStatus();
    const original = excepcion.getResponse();
    const cuerpo: Record<string, unknown> =
      typeof original === 'string' ? { statusCode: estado, message: original } : { ...original };

    const mensajes = (Array.isArray(cuerpo.message) ? cuerpo.message : [cuerpo.message]).map((mensaje) =>
      typeof mensaje === 'string' ? codigoDeMensaje(mensaje) : null,
    );
    if (Array.isArray(cuerpo.message)) cuerpo.codigos = mensajes;
    const codigo = mensajes.find((codigoMensaje) => codigoMensaje !== null) ?? codigoPorEstado(estado);
    if (codigo) cuerpo.codigo = codigo;

    host.switchToHttp().getResponse<Response>().status(estado).json(cuerpo);
  }
}
