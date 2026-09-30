import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IniciarSesionDto } from './iniciar-sesion.dto.js';
import { RegistrarUsuarioDto } from './registrar-usuario.dto.js';

async function validarDatos(datos: Record<string, unknown>) {
  const instancia = plainToInstance(RegistrarUsuarioDto, datos);
  return validate(instancia);
}

const DATOS_BASE = {
  correo: 'ana@example.com',
  contrasena: 'Abcdefg1',
};

describe('RegistrarUsuarioDto', () => {
  it('exige correoTutor cuando la fecha de nacimiento implica ser menor de 18 años', async () => {
    const errores = await validarDatos({
      ...DATOS_BASE,
      fechaNacimiento: '2015-01-01T00:00:00.000Z',
    });

    const errorCorreoTutor = errores.find((error) => error.property === 'correoTutor');
    expect(errorCorreoTutor).toBeDefined();
  });

  it('no exige correoTutor cuando la fecha de nacimiento implica ser mayor de edad', async () => {
    const errores = await validarDatos({
      ...DATOS_BASE,
      fechaNacimiento: '1990-01-01T00:00:00.000Z',
    });

    const errorCorreoTutor = errores.find((error) => error.property === 'correoTutor');
    expect(errorCorreoTutor).toBeUndefined();
  });

  it('acepta un menor de edad si se indica un correoTutor válido', async () => {
    const errores = await validarDatos({
      ...DATOS_BASE,
      fechaNacimiento: '2015-01-01T00:00:00.000Z',
      correoTutor: 'tutor@example.com',
    });

    expect(errores).toHaveLength(0);
  });

  it('rechaza el registro si falta la fecha de nacimiento', async () => {
    const errores = await validarDatos(DATOS_BASE);

    const errorFecha = errores.find((error) => error.property === 'fechaNacimiento');
    expect(errorFecha).toBeDefined();
  });

  it('guarda los correos sin espacios y en minúsculas (teclado del móvil)', async () => {
    const instancia = plainToInstance(RegistrarUsuarioDto, {
      ...DATOS_BASE,
      correo: ' Ana.Borrell@Gmail.com ',
      fechaNacimiento: '2015-01-01T00:00:00.000Z',
      correoTutor: 'Tutor@Example.com ',
    });

    expect(await validate(instancia)).toEqual([]);
    expect(instancia.correo).toBe('ana.borrell@gmail.com');
    expect(instancia.correoTutor).toBe('tutor@example.com');
  });

  it('al iniciar sesión, el correo también se normaliza', async () => {
    const instancia = plainToInstance(IniciarSesionDto, { correo: 'Ana@Example.com ', contrasena: 'x' });

    expect(await validate(instancia)).toEqual([]);
    expect(instancia.correo).toBe('ana@example.com');
  });

  it('el Pomodoro acepta desde 5 minutos de trabajo y 1 de descanso, y no menos', async () => {
    const { ActualizarPreferenciasDto } = await import('./actualizar-preferencias.dto.js');
    const valido = plainToInstance(ActualizarPreferenciasDto, {
      pomodoro: { trabajo: 5, descansoCorto: 1, descansoLargo: 5, ciclos: 3 },
    });
    expect(await validate(valido)).toEqual([]);

    const corto = plainToInstance(ActualizarPreferenciasDto, {
      pomodoro: { trabajo: 3, descansoCorto: 0, descansoLargo: 5, ciclos: 3 },
    });
    expect(await validate(corto)).not.toEqual([]);

    const reiniciar = plainToInstance(ActualizarPreferenciasDto, { pomodoro: null });
    expect(await validate(reiniciar)).toEqual([]);
  });
});
