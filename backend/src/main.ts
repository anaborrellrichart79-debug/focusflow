import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AplicacionModule } from './aplicacion.module.js';

async function arrancar() {
  const aplicacion = await NestFactory.create(AplicacionModule);

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
