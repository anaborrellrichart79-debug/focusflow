import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator.js';
import { GuardaConsentimientoConfirmado } from '../autenticacion/guardias/consentimiento-confirmado.guard.js';
import type { UsuarioPeticion } from '../autenticacion/interfaces/carga-util-jwt.interface.js';
import type { TipoImagen } from '../ia/ia.service.js';
import { FotosService } from './fotos.service.js';

// Anthropic admite imágenes de hasta 5 MB; el navegador ya las reduce antes
// de subirlas, así que normalmente pesan mucho menos.
const TAMANO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_ADMITIDOS: TipoImagen[] = ['image/jpeg', 'image/png', 'image/webp'];

// Lo que interesa del fichero que deja FileInterceptor (multer, en memoria).
interface FotoSubida {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

function comoImagen(foto: FotoSubida | undefined) {
  if (!foto || !TIPOS_ADMITIDOS.includes(foto.mimetype as TipoImagen) || foto.size > TAMANO_MAXIMO) {
    throw new BadRequestException('Sube una foto (JPG, PNG o WEBP) de menos de 5 MB');
  }
  return { datos: foto.buffer, tipo: foto.mimetype as TipoImagen };
}

// POST porque cada llamada lee la foto con la IA (y tarda), aunque no guarda
// nada: devuelve una propuesta para revisar. La foto va en el campo "foto"
// de un formulario multipart y no se guarda en ningún sitio.
@UseGuards(AuthGuard('jwt'), GuardaConsentimientoConfirmado)
@Controller('ia/fotos')
export class FotosController {
  constructor(private readonly fotos: FotosService) {}

  @Post('horario/:horarioId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 2 * TAMANO_MAXIMO } }))
  leerHorario(
    @UsuarioActual() usuario: UsuarioPeticion,
    @Param('horarioId', ParseUUIDPipe) horarioId: string,
    @UploadedFile() foto: FotoSubida | undefined,
  ) {
    return this.fotos.proponerHorario(usuario.id, horarioId, comoImagen(foto));
  }

  @Post('entregas')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 2 * TAMANO_MAXIMO } }))
  leerEntregas(@UsuarioActual() usuario: UsuarioPeticion, @UploadedFile() foto: FotoSubida | undefined) {
    return this.fotos.proponerEntregas(usuario.id, comoImagen(foto));
  }
}
