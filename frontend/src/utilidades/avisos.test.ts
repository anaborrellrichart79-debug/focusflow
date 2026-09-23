import { createIntl } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { es } from '@/idiomas/es';
import type { Aviso, CalendarioEscolar } from '@/servicios/recordatorios';
import { esDiaNoLectivo, nombrePeriodo, textoAviso } from './avisos';

const intl = createIntl({ locale: 'es', messages: es });

function aviso(parcial: Pick<Aviso, 'tipo' | 'datos'>): Aviso {
  return {
    id: 'aviso-1',
    mensajeIa: null,
    mostradoEn: null,
    leidoEn: null,
    correoEnviadoEn: null,
    tareaId: null,
    creadoEn: '2026-09-23T10:00:00.000Z',
    ...parcial,
  } as Aviso;
}

describe('textoAviso', () => {
  it('revisión semanal: resumen con plurales', () => {
    expect(
      textoAviso(
        intl,
        aviso({
          tipo: 'REVISION_SEMANAL',
          datos: { pendientes: 5, vencidas: 1, proximos7Dias: 2, titulos: [] },
        }),
      ),
    ).toEqual({
      titulo: 'Revisión semanal de deberes',
      cuerpo: 'Tienes 5 tareas pendientes: 1 vencida y 2 vencen en los próximos 7 días.',
    });
  });

  it('entrega: incluye la hora solo si la tarea la tiene (sin desplazarla por la zona horaria)', () => {
    const conHora = textoAviso(
      intl,
      aviso({
        tipo: 'ENTREGA',
        datos: { titulo: 'Maqueta', fechaLimite: '2026-09-24T09:00:00.000Z', horasRestantes: 21 },
      }),
    );
    expect(conHora.titulo).toBe('Entrega en 21 h: Maqueta');
    expect(conHora.cuerpo).toMatch(/^«Maqueta» vence el 24 sept 2026, 9:00\.$/);

    const sinHora = textoAviso(
      intl,
      aviso({
        tipo: 'ENTREGA',
        datos: { titulo: 'Maqueta', fechaLimite: '2026-09-24T00:00:00.000Z', horasRestantes: 5 },
      }),
    );
    expect(sinHora.cuerpo).toBe('«Maqueta» vence el 24 sept 2026.');
  });

  it('vacaciones: nombre traducido, fechas y tareas que vencen antes', () => {
    expect(
      textoAviso(
        intl,
        aviso({
          tipo: 'VACACIONES',
          datos: {
            clave: 'navidad',
            nombre: 'Vacaciones de Navidad',
            inicio: '2026-12-22',
            fin: '2027-01-06',
            diasRestantes: 1,
            tareasAntes: 2,
          },
        }),
      ),
    ).toEqual({
      titulo: 'Vacaciones de Navidad: empiezan mañana',
      cuerpo: 'Del 22 de diciembre al 6 de enero no hay clase. Tienes 2 tareas que vencen antes.',
    });
  });

  it('vacaciones de un solo día, sin tareas pendientes', () => {
    expect(
      textoAviso(
        intl,
        aviso({
          tipo: 'VACACIONES',
          datos: {
            clave: 'dia-comunidad',
            nombre: 'Día de la Comunitat Valenciana',
            inicio: '2026-10-09',
            fin: '2026-10-09',
            diasRestantes: 0,
            tareasAntes: 0,
          },
        }),
      ),
    ).toEqual({
      titulo: 'Día de la Comunitat Valenciana: es hoy',
      cuerpo: 'El 9 de octubre no hay clase.',
    });
  });

  it('emergencia', () => {
    expect(
      textoAviso(intl, aviso({ tipo: 'EMERGENCIA', datos: { titulo: 'Apuntes', diasSinTocar: 4 } })).titulo,
    ).toBe('¡Alarma! «Apuntes» lleva 4 días sin revisar');
  });
});

describe('textoAviso de la revisión familiar', () => {
  it('petición de revisión, aprobada y devuelta (con el comentario como cuerpo)', () => {
    expect(
      textoAviso(intl, aviso({ tipo: 'REVISION_SOLICITADA', datos: { titulo: 'Maqueta', nombre: 'Lucía' } })),
    ).toEqual({
      titulo: 'Lucía espera tu revisión',
      cuerpo: 'Lucía ha terminado «Maqueta» y te pide que la revises.',
    });
    expect(
      textoAviso(
        intl,
        aviso({
          tipo: 'REVISION_RESUELTA',
          datos: { titulo: 'Maqueta', nombre: 'Mamá', decision: 'DEVUELTA', comentario: 'Falta Saturno' },
        }),
      ),
    ).toEqual({ titulo: 'Mamá te ha devuelto «Maqueta»', cuerpo: 'Falta Saturno' });
    expect(
      textoAviso(
        intl,
        aviso({
          tipo: 'REVISION_RESUELTA',
          datos: { titulo: 'Maqueta', nombre: 'Mamá', decision: 'APROBADA', comentario: null },
        }),
      ).titulo,
    ).toBe('Mamá ha aprobado «Maqueta»');
  });
});

describe('nombrePeriodo', () => {
  it('traduce los periodos comunes y deja tal cual el día de la comunidad y los propios', () => {
    expect(nombrePeriodo(intl, { clave: 'semana-santa', nombre: 'x' })).toBe('Vacaciones de Semana Santa');
    expect(nombrePeriodo(intl, { clave: 'dia-comunidad', nombre: 'Diada de Catalunya' })).toBe(
      'Diada de Catalunya',
    );
  });
});

describe('esDiaNoLectivo', () => {
  const calendario: CalendarioEscolar = {
    curso: '2026-2027',
    comunidad: 'COMUNITAT_VALENCIANA',
    inicioClases: '2026-09-09',
    finClases: '2027-06-18',
    periodos: [{ clave: 'navidad', nombre: 'Navidad', inicio: '2026-12-22', fin: '2027-01-06' }],
    propios: [{ id: 'p', nombre: 'Fiesta local', inicio: '2026-10-05', fin: '2026-10-05' }],
  };
  const dia = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`);

  it('vacaciones, días propios y fuera del curso son no lectivos', () => {
    expect(esDiaNoLectivo(calendario, dia('2027-01-06'))).toBe(true);
    expect(esDiaNoLectivo(calendario, dia('2026-10-05'))).toBe(true);
    expect(esDiaNoLectivo(calendario, dia('2026-09-08'))).toBe(true);
    expect(esDiaNoLectivo(calendario, dia('2027-06-21'))).toBe(true);
  });

  it('un día de curso normal es lectivo; sin calendario, siempre', () => {
    expect(esDiaNoLectivo(calendario, dia('2027-01-07'))).toBe(false);
    expect(esDiaNoLectivo(null, dia('2027-01-06'))).toBe(false);
  });
});
