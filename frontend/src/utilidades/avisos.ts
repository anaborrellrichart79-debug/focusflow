import type { IntlShape } from 'react-intl';
import type { Aviso, CalendarioEscolar, PeriodoNoLectivo } from '@/servicios/recordatorios';
import { tieneHoraInicio } from './fechas';

// Nombre traducido de un periodo no lectivo precargado. El día de cada
// comunidad y los días propios se muestran con su nombre tal cual.
const CLAVES_PERIODO_TRADUCIDAS = ['navidad', 'semana-santa', 'verano', 'hispanidad', 'inmaculada'];

export function nombrePeriodo(intl: IntlShape, periodo: Pick<PeriodoNoLectivo, 'clave' | 'nombre'>) {
  return CLAVES_PERIODO_TRADUCIDAS.includes(periodo.clave)
    ? intl.formatMessage({ id: `periodo.${periodo.clave}` })
    : periodo.nombre;
}

// Fecha "YYYY-MM-DD" sin zona horaria (se formatea en UTC para que no se
// desplace un día según dónde esté el navegador).
export function formatearDia(intl: IntlShape, fecha: string) {
  return intl.formatDate(`${fecha}T00:00:00.000Z`, { timeZone: 'UTC', day: 'numeric', month: 'long' });
}

// Texto visible de un aviso, traducido, a partir de su tipo y sus datos. El
// backend guarda solo los datos (no conoce el idioma de la interfaz).
export function textoAviso(intl: IntlShape, aviso: Aviso): { titulo: string; cuerpo: string } {
  switch (aviso.tipo) {
    case 'REVISION_SEMANAL':
      return {
        titulo: intl.formatMessage({ id: 'aviso.revision.titulo' }),
        cuerpo: intl.formatMessage(
          { id: 'aviso.revision.cuerpo' },
          {
            pendientes: aviso.datos.pendientes,
            vencidas: aviso.datos.vencidas,
            proximos: aviso.datos.proximos7Dias,
          },
        ),
      };
    case 'ENTREGA': {
      const { fechaLimite, titulo, horasRestantes } = aviso.datos;
      const fecha = intl.formatDate(fechaLimite, {
        timeZone: 'UTC',
        dateStyle: 'medium',
        ...(tieneHoraInicio(fechaLimite) ? { timeStyle: 'short' } : {}),
      });
      return {
        titulo: intl.formatMessage({ id: 'aviso.entrega.titulo' }, { titulo, horas: horasRestantes }),
        cuerpo: intl.formatMessage({ id: 'aviso.entrega.cuerpo' }, { titulo, fecha }),
      };
    }
    case 'VACACIONES': {
      const { inicio, fin, diasRestantes, tareasAntes } = aviso.datos;
      const unSoloDia = inicio === fin;
      return {
        titulo: intl.formatMessage(
          { id: unSoloDia ? 'aviso.vacaciones.tituloDia' : 'aviso.vacaciones.titulo' },
          { nombre: nombrePeriodo(intl, aviso.datos), dias: diasRestantes },
        ),
        cuerpo:
          intl.formatMessage(
            { id: unSoloDia ? 'aviso.vacaciones.cuerpoDia' : 'aviso.vacaciones.cuerpo' },
            { inicio: formatearDia(intl, inicio), fin: formatearDia(intl, fin) },
          ) +
          (tareasAntes > 0
            ? ` ${intl.formatMessage({ id: 'aviso.vacaciones.tareasAntes' }, { cantidad: tareasAntes })}`
            : ''),
      };
    }
    case 'EMERGENCIA':
      return {
        titulo: intl.formatMessage(
          { id: 'aviso.emergencia.titulo' },
          { titulo: aviso.datos.titulo, dias: aviso.datos.diasSinTocar },
        ),
        cuerpo: intl.formatMessage({ id: 'aviso.emergencia.cuerpo' }),
      };
    case 'REVISION_SOLICITADA':
      return {
        titulo: intl.formatMessage(
          { id: 'aviso.revisionSolicitada.titulo' },
          { nombre: aviso.datos.nombre },
        ),
        cuerpo: intl.formatMessage(
          { id: 'aviso.revisionSolicitada.cuerpo' },
          { nombre: aviso.datos.nombre, titulo: aviso.datos.titulo },
        ),
      };
    case 'REVISION_RESUELTA': {
      const { nombre, titulo, decision, comentario } = aviso.datos;
      return decision === 'APROBADA'
        ? {
            titulo: intl.formatMessage({ id: 'aviso.revisionAprobada.titulo' }, { nombre, titulo }),
            cuerpo: comentario ?? intl.formatMessage({ id: 'aviso.revisionAprobada.cuerpo' }),
          }
        : {
            titulo: intl.formatMessage({ id: 'aviso.revisionDevuelta.titulo' }, { nombre, titulo }),
            cuerpo: comentario ?? intl.formatMessage({ id: 'aviso.revisionDevuelta.cuerpo' }),
          };
    }
  }
}

export function periodosDelCalendario(calendario: CalendarioEscolar | null): PeriodoNoLectivo[] {
  if (!calendario) return [];
  return [
    ...calendario.periodos,
    ...calendario.propios.map((propio) => ({ ...propio, clave: `propio-${propio.id}` })),
  ];
}

// ¿Hay clase ese día? Fuera del curso (antes del primer día o después del
// último) tampoco. La fecha es la de la Agenda: un Date en UTC que representa
// el día de reloj.
export function esDiaNoLectivo(calendario: CalendarioEscolar | null, fecha: Date): boolean {
  if (!calendario) return false;
  const dia = fecha.toISOString().slice(0, 10);
  if (calendario.inicioClases && dia < calendario.inicioClases) return true;
  if (calendario.finClases && dia > calendario.finClases) return true;
  return periodosDelCalendario(calendario).some((periodo) => periodo.inicio <= dia && dia <= periodo.fin);
}
