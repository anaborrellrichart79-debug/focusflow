import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AplicacionModule } from '../src/aplicacion.module.js';

// Requiere Postgres arrancado (`docker compose up -d`) y las variables de
// entorno DATABASE_URL/JWT_SECRET configuradas, porque levanta la aplicación
// completa (incluida la conexión real a la base de datos vía ServicioPrisma).
describe('AplicacionController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AplicacionModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('¡Bienvenido a la API de FocusFlow!');
  });

  afterEach(async () => {
    await app.close();
  });
});
