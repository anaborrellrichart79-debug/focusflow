import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { Usuario } from '../generated/prisma/client.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import type { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';

const RONDAS_HASH_CONTRASENA = 10;

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly jwtService: JwtService,
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

    const usuario = await this.prisma.usuario.create({
      data: {
        correo: datos.correo,
        contrasena: contrasenaHasheada,
        nombre: datos.nombre,
      },
    });

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

    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
    };
  }

  private generarRespuestaAutenticacion(usuario: Usuario) {
    const cargaUtil = { sub: usuario.id, correo: usuario.correo };

    return {
      tokenAcceso: this.jwtService.sign(cargaUtil),
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
      },
    };
  }
}
