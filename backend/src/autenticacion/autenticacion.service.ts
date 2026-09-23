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
import { calcularEdad } from '../comun/edad.util.js';
import { CorreoService } from '../correo/correo.service.js';
import type { Usuario } from '../generated/prisma/client.js';
import type { PerfilUsuario } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import type { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';

const RONDAS_HASH_CONTRASENA = 10;
const TIPO_TOKEN_CONSENTIMIENTO = 'confirmacion-consentimiento';
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
        consentimientoConfirmado: !esMenorDeEdad,
      },
    });

    if (esMenorDeEdad && datos.correoTutor) {
      // La falta de SMTP configurado no debe impedir que el registro se
      // complete: el correo se puede reenviar más adelante desde la pantalla
      // de "cuenta pendiente de confirmación" (ver reenviarConfirmacion).
      try {
        await this.enviarCorreoConsentimiento(usuario.id, datos.correoTutor);
      } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        console.warn(
          `No se pudo enviar el correo de consentimiento para ${usuario.id}: envío de correo no configurado`,
        );
      }
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

    if (
      usuario.consentimientoReenviadoEn &&
      Date.now() - usuario.consentimientoReenviadoEn.getTime() < MINUTOS_ENTRE_REENVIOS * 60_000
    ) {
      throw new BadRequestException(
        `Espera unos minutos antes de volver a pedir el correo de confirmación`,
      );
    }

    // A diferencia del envío automático en registrar(), aquí el usuario ha
    // pulsado "Reenviar correo" explícitamente: si el SMTP no está
    // configurado, el error debe llegar tal cual al frontend (igual que
    // "Conectar con Google" sin credenciales configuradas).
    await this.enviarCorreoConsentimiento(usuario.id, usuario.correoTutor);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { consentimientoReenviadoEn: new Date() },
    });
  }

  async actualizarPreferencias(
    usuarioId: string,
    datos: { modoEscolarActivo?: boolean; perfiles?: PerfilUsuario[] },
  ) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        modoEscolarActivo: datos.modoEscolarActivo,
        perfiles: datos.perfiles ? [...new Set(datos.perfiles)] : undefined,
      },
    });

    return this.aDatosPublicos(usuario);
  }

  private async enviarCorreoConsentimiento(usuarioId: string, correoTutor: string) {
    const token = this.jwtService.sign(
      { sub: usuarioId, tipo: TIPO_TOKEN_CONSENTIMIENTO },
      { expiresIn: '30d' },
    );
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const enlaceConfirmacion = `${frontendUrl}/confirmar-consentimiento?token=${token}`;

    await this.correoService.enviarCorreoConfirmacionConsentimiento(correoTutor, enlaceConfirmacion);
  }

  private aDatosPublicos(usuario: Usuario) {
    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      consentimientoConfirmado: usuario.consentimientoConfirmado,
      modoEscolarActivo: usuario.modoEscolarActivo,
      perfiles: usuario.perfiles ?? [],
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
