import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ServicioPrisma } from '../../prisma/prisma.service.js';
import type { UsuarioPeticion } from '../interfaces/carga-util-jwt.interface.js';

// Se aplica junto a AuthGuard('jwt') en los controladores de datos (tareas,
// objetivos, pomodoro, etiquetas, google): el JWT en sí no lleva
// consentimientoConfirmado (para no tener que reemitirlo cuando un tutor
// confirma), así que se relee de la base de datos en cada petición. Esto
// evita que un menor sin confirmar pueda saltarse el bloqueo solo con una
// llamada directa a la API, sin depender únicamente de la ruta protegida del
// frontend.
@Injectable()
export class GuardaConsentimientoConfirmado implements CanActivate {
  constructor(private readonly prisma: ServicioPrisma) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<{ user: UsuarioPeticion }>();
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: peticion.user.id },
      select: { consentimientoConfirmado: true },
    });

    if (usuario && !usuario.consentimientoConfirmado) {
      throw new ForbiddenException('Cuenta pendiente de confirmación de un tutor legal');
    }

    return true;
  }
}
