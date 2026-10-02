import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AplicacionModule } from './aplicacion.module.js';

async function arrancar() {
  // rawBody: el webhook de Stripe comprueba la firma con el cuerpo tal cual llegó.
  const aplicacion = await NestFactory.create(AplicacionModule, { rawBody: true });

  aplicacion.enableCors();
  aplicacion.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const puerto = process.env.PORT ?? 3000;
  await aplicacion.listen(puerto);
}
await arrancar();
