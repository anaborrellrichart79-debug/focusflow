import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { comoIdioma, type Idioma } from '../comun/idiomas.js';
import { calcularEdad } from '../comun/edad.util.js';
import { CorreoService } from '../correo/correo.service.js';
import type { Usuario } from '../generated/prisma/client.js';
import type { PerfilUsuario } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import type { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';

const RONDAS_HASH_CONTRASENA = 10;
const TIPO_TOKEN_CONSENTIMIENTO = 'confirmacion-consentimiento';
const TIPO_TOKEN_VERIFICACION = 'verificacion-correo';
const MINUTOS_ENTRE_REENVIOS = 5;

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly correoService: CorreoService,
  ) {}

  async registrar(datos: RegistrarUsuarioDto) {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo: datos.correo },
    });

    if (usuarioExistente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const contrasenaHasheada = await bcrypt.hash(
      datos.contrasena,
      RONDAS_HASH_CONTRASENA,
    );

    const esMenorDeEdad = calcularEdad(datos.fechaNacimiento) < 18;

    const usuario = await this.prisma.usuario.create({
      data: {
        correo: datos.correo,
        contrasena: contrasenaHasheada,
        nombre: datos.nombre,
        fechaNacimiento: new Date(datos.fechaNacimiento),
        correoTutor: datos.correoTutor,
        idioma: datos.idioma ?? 'es',
        bienvenidaCompletada: false,
        consentimientoConfirmado: !esMenorDeEdad,
        correoVerificado: false,
      },
    });
    const idioma = comoIdioma(usuario.idioma);

    // La falta de SMTP configurado no debe impedir que el registro se
    // complete: los dos correos se pueden reenviar más adelante (ver
    // reenviarConfirmacion y reenviarVerificacion).
    await this.enviarSinBloquearRegistro(usuario.id, 'verificación', () =>
      this.enviarCorreoVerificacion(usuario.id, usuario.correo, idioma),
    );
    if (esMenorDeEdad && datos.correoTutor) {
      const correoTutor = datos.correoTutor;
      await this.enviarSinBloquearRegistro(usuario.id, 'consentimiento', () =>
        this.enviarCorreoConsentimiento(usuario.id, correoTutor, idioma),
      );
    }

    return this.generarRespuestaAutenticacion(usuario);
  }

  async iniciarSesion(datos: IniciarSesionDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: datos.correo },
    });

    if (!usuario) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const contrasenaValida = await bcrypt.compare(
      datos.contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.generarRespuestaAutenticacion(usuario);
  }

  async obtenerUsuarioPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.aDatosPublicos(usuario);
  }

  async confirmarConsentimiento(token: string) {
    let carga: { sub: string; tipo: string };
    try {
      carga = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Enlace de confirmación caducado o inválido');
    }

    if (carga.tipo !== TIPO_TOKEN_CONSENTIMIENTO) {
      throw new UnauthorizedException('Enlace de confirmación caducado o inválido');
    }

    await this.prisma.usuario.update({
      where: { id: carga.sub },
      data: { consentimientoConfirmado: true },
    });
  }

  async reenviarConfirmacion(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.correoTutor) {
      throw new BadRequestException('Esta cuenta no tiene un correo de tutor registrado');
    }

    if (reenviadoHacePoco(usuario.consentimientoReenviadoEn)) {
      throw new BadRequestException('Espera unos minutos antes de volver a pedir el correo');
    }

    // A diferencia del envío automático en registrar(), aquí el usuario ha
    // pulsado "Reenviar correo" explícitamente: si el SMTP no está
    // configurado, el error debe llegar tal cual al frontend (igual que
    // "Conectar con Google" sin credenciales configuradas).
    await this.enviarCorreoConsentimiento(usuario.id, usuario.correoTutor, comoIdioma(usuario.idioma));

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { consentimientoReenviadoEn: new Date() },
    });
  }

  async verificarCorreo(token: string) {
    let carga: { sub: string; tipo: string; correo?: string };
    try {
      carga = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Enlace de verificación caducado o inválido');
    }

    if (carga.tipo !== TIPO_TOKEN_VERIFICACION) {
      throw new UnauthorizedException('Enlace de verificación caducado o inválido');
    }

    // El token lleva el correo al que se envió: si la cuenta ya no existe o
    // su correo es otro, el enlace no sirve.
    const { count } = await this.prisma.usuario.updateMany({
      where: { id: carga.sub, correo: carga.correo },
      data: { correoVerificado: true },
    });
    if (count === 0) {
      throw new UnauthorizedException('Enlace de verificación caducado o inválido');
    }
  }

  async reenviarVerificacion(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Ya verificado: no hay nada que enviar (p. ej. dos pestañas abiertas).
    if (usuario.correoVerificado) return;

    if (reenviadoHacePoco(usuario.verificacionReenviadaEn)) {
      throw new BadRequestException('Espera unos minutos antes de volver a pedir el correo');
    }

    // Igual que reenviarConfirmacion: pedido a mano, así que si el SMTP no
    // está configurado el error llega al frontend.
    await this.enviarCorreoVerificacion(usuario.id, usuario.correo, comoIdioma(usuario.idioma));

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { verificacionReenviadaEn: new Date() },
    });
  }

  async actualizarPreferencias(
    usuarioId: string,
    datos: { modoEscolarActivo?: boolean; perfiles?: PerfilUsuario[]; idioma?: Idioma; bienvenidaCompletada?: true },
  ) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        modoEscolarActivo: datos.modoEscolarActivo,
        perfiles: datos.perfiles ? [...new Set(datos.perfiles)] : undefined,
        idioma: datos.idioma,
        bienvenidaCompletada: datos.bienvenidaCompletada,
      },
    });

    return this.aDatosPublicos(usuario);
  }

  private async enviarCorreoConsentimiento(usuarioId: string, correoTutor: string, idioma: Idioma) {
    const token = this.jwtService.sign(
      { sub: usuarioId, tipo: TIPO_TOKEN_CONSENTIMIENTO },
      { expiresIn: '30d' },
    );
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const enlaceConfirmacion = `${frontendUrl}/confirmar-consentimiento?token=${token}`;

    await this.correoService.enviarCorreoConfirmacionConsentimiento(correoTutor, enlaceConfirmacion, idioma);
  }

  private async enviarCorreoVerificacion(usuarioId: string, correo: string, idioma: Idioma) {
    const token = this.jwtService.sign(
      { sub: usuarioId, tipo: TIPO_TOKEN_VERIFICACION, correo },
      { expiresIn: '7d' },
    );
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const enlaceVerificacion = `${frontendUrl}/verificar-correo?token=${token}`;

    await this.correoService.enviarCorreoVerificacion(correo, enlaceVerificacion, idioma);
  }

  private async enviarSinBloquearRegistro(usuarioId: string, tipo: string, enviar: () => Promise<void>) {
    // Cualquier fallo (SMTP sin configurar o el proveedor caído): la cuenta ya
    // está creada, así que el registro no debe responder con error.
    try {
      await enviar();
    } catch (error) {
      const motivo =
        error instanceof BadRequestException ? 'envío de correo no configurado' : (error as Error).message;
      console.warn(`No se pudo enviar el correo de ${tipo} para ${usuarioId}: ${motivo}`);
    }
  }

  private aDatosPublicos(usuario: Usuario) {
    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      consentimientoConfirmado: usuario.consentimientoConfirmado,
      correoVerificado: usuario.correoVerificado,
      modoEscolarActivo: usuario.modoEscolarActivo,
      perfiles: usuario.perfiles ?? [],
      idioma: comoIdioma(usuario.idioma),
      bienvenidaCompletada: usuario.bienvenidaCompletada,
    };
  }

  private generarRespuestaAutenticacion(usuario: Usuario) {
    const cargaUtil = { sub: usuario.id, correo: usuario.correo };

    return {
      tokenAcceso: this.jwtService.sign(cargaUtil),
      usuario: this.aDatosPublicos(usuario),
    };
  }
}

function reenviadoHacePoco(fecha: Date | null) {
  return fecha !== null && Date.now() - fecha.getTime() < MINUTOS_ENTRE_REENVIOS * 60_000;
}
