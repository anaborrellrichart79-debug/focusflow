import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
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
});
