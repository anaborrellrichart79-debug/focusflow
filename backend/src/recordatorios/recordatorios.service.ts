import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CorreoService } from '../correo/correo.service.js';
import { ServicioPrisma } from '../prisma/prisma.service.js';
import type {
  ActualizarEmergenciaDto,
  ActualizarRecordatorioDto,
  CrearRecordatorioDto,
} from './dto/recordatorios.dto.js';

@Injectable()
export class RecordatoriosService {
  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly correo: CorreoService,
    private readonly config: ConfigService,
  ) {}

  async obtenerConfiguracion(usuarioId: string) {
    const [recordatorios, usuario] = await Promise.all([
      this.prisma.recordatorio.findMany({
        where: { usuarioId },
        orderBy: { creadoEn: 'asc' },
      }),
      this.prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: {
          emergenciaActiva: true,
          emergenciaDias: true,
          emergenciaPorCorreo: true,
        },
      }),
    ]);

    return {
      recordatorios,
      emergencia: {
        activa: usuario.emergenciaActiva,
        dias: usuario.emergenciaDias,
        porCorreo: usuario.emergenciaPorCorreo,
      },
      // Para que la interfaz avise de que las casillas "por correo" no harán
      // nada hasta configurar el SMTP, y de si la redacción con IA está activa.
      correoDisponible: this.correo.estaConfigurado(),
      iaDisponible: Boolean(this.config.get('OLLAMA_URL')),
    };
  }

  crear(usuarioId: string, datos: CrearRecordatorioDto) {
    return this.prisma.recordatorio.create({
      data: {
        tipo: datos.tipo,
        diaSemana: datos.diaSemana,
        hora: datos.hora,
        horasAntes: datos.horasAntes,
        diasAntes: datos.diasAntes,
        soloEscolar: datos.soloEscolar ?? false,
        porCorreo: datos.porCorreo ?? false,
        usuarioId,
      },
    });
  }

  async actualizar(
    usuarioId: string,
    id: string,
    datos: ActualizarRecordatorioDto,
  ) {
    await this.comprobarPropiedad(usuarioId, id);
    return this.prisma.recordatorio.update({ where: { id }, data: datos });
  }

  async eliminar(usuarioId: string, id: string) {
    await this.comprobarPropiedad(usuarioId, id);
    await this.prisma.recordatorio.delete({ where: { id } });
  }

  async actualizarEmergencia(
    usuarioId: string,
    datos: ActualizarEmergenciaDto,
  ) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        emergenciaActiva: datos.activa,
        emergenciaDias: datos.dias,
        emergenciaPorCorreo: datos.porCorreo,
      },
      select: {
        emergenciaActiva: true,
        emergenciaDias: true,
        emergenciaPorCorreo: true,
      },
    });
    return {
      activa: usuario.emergenciaActiva,
      dias: usuario.emergenciaDias,
      porCorreo: usuario.emergenciaPorCorreo,
    };
  }

  private async comprobarPropiedad(usuarioId: string, id: string) {
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: { id, usuarioId },
    });
    if (!recordatorio)
      throw new NotFoundException('Recordatorio no encontrado');
  }
}
