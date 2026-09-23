import type { TipoAviso } from '../generated/prisma/enums.js';

// Texto por reglas de cada aviso, en castellano. Lo usa el correo (el backend
// no conoce el idioma de la interfaz; en la app el frontend compone su propio
// texto traducido a partir de tipo + datos) y sirve de base a Ollama.

export interface DatosRevision {
  pendientes: number;
  vencidas: number;
  proximos7Dias: number;
  titulos: string[];
}

export interface DatosEntrega {
  titulo: string;
  fechaLimite: string;
  horasRestantes: number;
}

export interface DatosVacaciones {
  clave: string;
  nombre: string;
  inicio: string;
  fin: string;
  diasRestantes: number;
  tareasAntes: number;
}

export interface DatosEmergencia {
  titulo: string;
  diasSinTocar: number;
}

// Avisos de la revisión familiar (los crea TareasService / FamiliaService, no
// el proceso programado). "nombre" es el de la otra persona.
export interface DatosRevisionSolicitada {
  titulo: string;
  nombre: string;
}

export interface DatosRevisionResuelta {
  titulo: string;
  nombre: string;
  decision: 'APROBADA' | 'DEVUELTA';
  comentario: string | null;
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export function textoAviso(
  tipo: TipoAviso,
  datos: unknown,
): { titulo: string; cuerpo: string } {
  switch (tipo) {
    case 'REVISION_SEMANAL': {
      const d = datos as DatosRevision;
      return {
        titulo: 'Revisión semanal de deberes',
        cuerpo:
          `Tienes ${d.pendientes} tareas pendientes: ${d.vencidas} vencidas y ` +
          `${d.proximos7Dias} que vencen en los próximos 7 días.`,
      };
    }
    case 'ENTREGA': {
      const d = datos as DatosEntrega;
      return {
        titulo: `Entrega en ${d.horasRestantes} h: ${d.titulo}`,
        cuerpo: `«${d.titulo}» vence el ${formatearFecha(d.fechaLimite)}. Quedan unas ${d.horasRestantes} horas.`,
      };
    }
    case 'VACACIONES': {
      const d = datos as DatosVacaciones;
      const unSoloDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unSoloDia
            ? 'es hoy'
            : 'empiezan hoy'
          : unSoloDia
            ? `en ${d.diasRestantes} días`
            : `empiezan en ${d.diasRestantes} días`;
      return {
        titulo: `${d.nombre}: ${cuando}`,
        cuerpo:
          (unSoloDia
            ? `El ${formatearFecha(d.inicio)} no hay clase.`
            : `Del ${formatearFecha(d.inicio)} al ${formatearFecha(d.fin)} no hay clase.`) +
          (d.tareasAntes > 0
            ? ` Tienes ${d.tareasAntes} tareas que vencen antes.`
            : ''),
      };
    }
    case 'EMERGENCIA': {
      const d = datos as DatosEmergencia;
      return {
        titulo: `¡Alarma! «${d.titulo}» lleva ${d.diasSinTocar} días sin revisar`,
        cuerpo: `La tarea «${d.titulo}» no se ha tocado desde hace ${d.diasSinTocar} días. Revísala cuanto antes.`,
      };
    }
    case 'REVISION_SOLICITADA': {
      const d = datos as DatosRevisionSolicitada;
      return {
        titulo: `${d.nombre} espera tu revisión`,
        cuerpo: `${d.nombre} ha terminado «${d.titulo}» y te ha pedido que la revises.`,
      };
    }
    case 'REVISION_RESUELTA': {
      const d = datos as DatosRevisionResuelta;
      return d.decision === 'APROBADA'
        ? {
            titulo: `${d.nombre} ha aprobado «${d.titulo}»`,
            cuerpo: `${d.nombre} ha revisado la tarea y está bien.`,
          }
        : {
            titulo: `${d.nombre} te ha devuelto «${d.titulo}»`,
            cuerpo: d.comentario ?? 'Revisa la tarea y vuelve a marcarla como hecha.',
          };
    }
  }
}

function escaparHtml(texto: string) {
  return texto.replace(
    /[&<>"']/g,
    (caracter) => `&#${caracter.charCodeAt(0)};`,
  );
}

export function htmlCorreoAvisos(
  avisos: { tipo: TipoAviso; datos: unknown; mensajeIa: string | null }[],
  enlaceApp: string,
) {
  // Las alarmas de emergencia de una misma pasada comparten el texto de la IA:
  // se pone solo una vez.
  const textosIaPuestos = new Set<string>();
  const bloques = avisos.map((aviso) => {
    const { titulo, cuerpo } = textoAviso(aviso.tipo, aviso.datos);
    let ia = '';
    if (aviso.mensajeIa && !textosIaPuestos.has(aviso.mensajeIa)) {
      textosIaPuestos.add(aviso.mensajeIa);
      ia = `<p><em>${escaparHtml(aviso.mensajeIa)}</em></p>`;
    }
    return `<h3>${escaparHtml(titulo)}</h3><p>${escaparHtml(cuerpo)}</p>${ia}`;
  });
  return `${bloques.join('')}<p><a href="${enlaceApp}">Abrir FocusFlow</a></p>`;
}
