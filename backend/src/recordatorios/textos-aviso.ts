import type { Idioma } from '../comun/idiomas.js';
import type { TipoAviso } from '../generated/prisma/enums.js';

// Texto por reglas de cada aviso, en el idioma del usuario (Usuario.idioma).
// Lo usan el correo, las notificaciones push y las instrucciones a Ollama; en
// la app abierta el frontend compone su propio texto a partir de tipo + datos.

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

interface Texto {
  titulo: string;
  cuerpo: string;
}

interface TextosIdioma {
  revision: (d: DatosRevision) => Texto;
  entrega: (d: DatosEntrega, fecha: string) => Texto;
  // `nombre` ya traducido si es un periodo conocido (Navidad...).
  vacaciones: (d: DatosVacaciones, nombre: string, inicio: string, fin: string) => Texto;
  emergencia: (d: DatosEmergencia) => Texto;
  revisionSolicitada: (d: DatosRevisionSolicitada) => Texto;
  revisionAprobada: (d: DatosRevisionResuelta) => Texto;
  revisionDevuelta: (d: DatosRevisionResuelta) => Texto;
  periodos: Record<string, string>;
  variosAvisos: (cantidad: number) => string;
  asuntoEmergencias: (cantidad: number) => string;
  asuntoVarios: (cantidad: number) => string;
  abrirApp: string;
  pruebaPush: string;
}

const TEXTOS: Record<Idioma, TextosIdioma> = {
  es: {
    revision: (d) => ({
      titulo: 'Revisión semanal de deberes',
      cuerpo: `Tienes ${d.pendientes} tareas pendientes: ${d.vencidas} vencidas y ${d.proximos7Dias} que vencen en los próximos 7 días.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Entrega en ${d.horasRestantes} h: ${d.titulo}`,
      cuerpo: `«${d.titulo}» vence el ${fecha}. Quedan unas ${d.horasRestantes} horas.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'es hoy'
            : 'empiezan hoy'
          : unDia
            ? `en ${d.diasRestantes} días`
            : `empiezan en ${d.diasRestantes} días`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `El ${inicio} no hay clase.` : `Del ${inicio} al ${fin} no hay clase.`) +
          (d.tareasAntes > 0 ? ` Tienes ${d.tareasAntes} tareas que vencen antes.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `¡Alarma! «${d.titulo}» lleva ${d.diasSinTocar} días sin revisar`,
      cuerpo: `La tarea «${d.titulo}» no se ha tocado desde hace ${d.diasSinTocar} días. Revísala cuanto antes.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} espera tu revisión`,
      cuerpo: `${d.nombre} ha terminado «${d.titulo}» y te ha pedido que la revises.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre} ha aprobado «${d.titulo}»`,
      cuerpo: `${d.nombre} ha revisado la tarea y está bien.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre} te ha devuelto «${d.titulo}»`,
      cuerpo: d.comentario ?? 'Revisa la tarea y vuelve a marcarla como hecha.',
    }),
    // En castellano vale el nombre que ya trae el calendario precargado.
    periodos: {},
    variosAvisos: (n) => `Tienes ${n} avisos nuevos`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: ${n} tareas llevan días sin revisar`,
    asuntoVarios: (n) => `FocusFlow: tienes ${n} recordatorios`,
    abrirApp: 'Abrir FocusFlow',
    pruebaPush: 'Los avisos funcionan en este dispositivo.',
  },
  en: {
    revision: (d) => ({
      titulo: 'Weekly homework review',
      cuerpo: `You have ${d.pendientes} pending tasks: ${d.vencidas} overdue and ${d.proximos7Dias} due in the next 7 days.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Due in ${d.horasRestantes} h: ${d.titulo}`,
      cuerpo: `“${d.titulo}” is due on ${fecha}. About ${d.horasRestantes} hours left.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'today'
            : 'start today'
          : unDia
            ? `in ${d.diasRestantes} days`
            : `start in ${d.diasRestantes} days`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `No school on ${inicio}.` : `No school from ${inicio} to ${fin}.`) +
          (d.tareasAntes > 0 ? ` You have ${d.tareasAntes} tasks due before then.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `Alarm! “${d.titulo}” hasn’t been reviewed for ${d.diasSinTocar} days`,
      cuerpo: `The task “${d.titulo}” hasn’t been touched for ${d.diasSinTocar} days. Review it as soon as you can.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} is waiting for your review`,
      cuerpo: `${d.nombre} has finished “${d.titulo}” and asked you to review it.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre} approved “${d.titulo}”`,
      cuerpo: `${d.nombre} has reviewed the task and it’s fine.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre} sent “${d.titulo}” back to you`,
      cuerpo: d.comentario ?? 'Review the task and mark it as done again.',
    }),
    periodos: {
      navidad: 'Christmas holidays',
      'semana-santa': 'Easter holidays',
      verano: 'Summer holidays',
      hispanidad: 'Spain’s National Day',
      inmaculada: 'Immaculate Conception',
    },
    variosAvisos: (n) => `You have ${n} new notifications`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: ${n} tasks haven’t been reviewed for days`,
    asuntoVarios: (n) => `FocusFlow: you have ${n} reminders`,
    abrirApp: 'Open FocusFlow',
    pruebaPush: 'Notifications work on this device.',
  },
  ca: {
    revision: (d) => ({
      titulo: 'Revisió setmanal de deures',
      cuerpo: `Tens ${d.pendientes} tasques pendents: ${d.vencidas} vençudes i ${d.proximos7Dias} que vencen en els pròxims 7 dies.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Entrega en ${d.horasRestantes} h: ${d.titulo}`,
      cuerpo: `«${d.titulo}» venç el ${fecha}. Queden unes ${d.horasRestantes} hores.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'és avui'
            : 'comencen avui'
          : unDia
            ? `d’aquí a ${d.diasRestantes} dies`
            : `comencen d’aquí a ${d.diasRestantes} dies`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `El ${inicio} no hi ha classe.` : `Del ${inicio} al ${fin} no hi ha classe.`) +
          (d.tareasAntes > 0 ? ` Tens ${d.tareasAntes} tasques que vencen abans.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `Alarma! «${d.titulo}» fa ${d.diasSinTocar} dies que no es revisa`,
      cuerpo: `La tasca «${d.titulo}» no s’ha tocat des de fa ${d.diasSinTocar} dies. Revisa-la com més aviat millor.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} espera la teva revisió`,
      cuerpo: `${d.nombre} ha acabat «${d.titulo}» i t’ha demanat que la revisis.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre} ha aprovat «${d.titulo}»`,
      cuerpo: `${d.nombre} ha revisat la tasca i està bé.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre} t’ha retornat «${d.titulo}»`,
      cuerpo: d.comentario ?? 'Revisa la tasca i torna a marcar-la com a feta.',
    }),
    periodos: {
      navidad: 'Vacances de Nadal',
      'semana-santa': 'Vacances de Setmana Santa',
      verano: 'Vacances d’estiu',
      hispanidad: 'Festa Nacional d’Espanya',
      inmaculada: 'Dia de la Immaculada Concepció',
    },
    variosAvisos: (n) => `Tens ${n} avisos nous`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: fa dies que no es revisen ${n} tasques`,
    asuntoVarios: (n) => `FocusFlow: tens ${n} recordatoris`,
    abrirApp: 'Obre FocusFlow',
    pruebaPush: 'Els avisos funcionen en aquest dispositiu.',
  },
  va: {
    revision: (d) => ({
      titulo: 'Revisió setmanal de deures',
      cuerpo: `Tens ${d.pendientes} tasques pendents: ${d.vencidas} vençudes i ${d.proximos7Dias} que vencen en els pròxims 7 dies.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Entrega en ${d.horasRestantes} h: ${d.titulo}`,
      cuerpo: `«${d.titulo}» venç el ${fecha}. Queden unes ${d.horasRestantes} hores.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'és hui'
            : 'comencen hui'
          : unDia
            ? `d’ací a ${d.diasRestantes} dies`
            : `comencen d’ací a ${d.diasRestantes} dies`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `El ${inicio} no hi ha classe.` : `Del ${inicio} al ${fin} no hi ha classe.`) +
          (d.tareasAntes > 0 ? ` Tens ${d.tareasAntes} tasques que vencen abans.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `Alarma! «${d.titulo}» fa ${d.diasSinTocar} dies que no es revisa`,
      cuerpo: `La tasca «${d.titulo}» no s’ha tocat des de fa ${d.diasSinTocar} dies. Revisa-la com més prompte millor.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} espera la teua revisió`,
      cuerpo: `${d.nombre} ha acabat «${d.titulo}» i t’ha demanat que la revises.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre} ha aprovat «${d.titulo}»`,
      cuerpo: `${d.nombre} ha revisat la tasca i està bé.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre} t’ha tornat «${d.titulo}»`,
      cuerpo: d.comentario ?? 'Revisa la tasca i torna a marcar-la com a feta.',
    }),
    periodos: {
      navidad: 'Vacances de Nadal',
      'semana-santa': 'Vacances de Setmana Santa',
      verano: 'Vacances d’estiu',
      hispanidad: 'Festa Nacional d’Espanya',
      inmaculada: 'Dia de la Immaculada Concepció',
    },
    variosAvisos: (n) => `Tens ${n} avisos nous`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: fa dies que no es revisen ${n} tasques`,
    asuntoVarios: (n) => `FocusFlow: tens ${n} recordatoris`,
    abrirApp: 'Obri FocusFlow',
    pruebaPush: 'Els avisos funcionen en este dispositiu.',
  },
  gl: {
    revision: (d) => ({
      titulo: 'Revisión semanal de deberes',
      cuerpo: `Tes ${d.pendientes} tarefas pendentes: ${d.vencidas} vencidas e ${d.proximos7Dias} que vencen nos próximos 7 días.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Entrega en ${d.horasRestantes} h: ${d.titulo}`,
      cuerpo: `«${d.titulo}» vence o ${fecha}. Quedan unhas ${d.horasRestantes} horas.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'é hoxe'
            : 'empezan hoxe'
          : unDia
            ? `en ${d.diasRestantes} días`
            : `empezan en ${d.diasRestantes} días`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `O ${inicio} non hai clase.` : `Do ${inicio} ao ${fin} non hai clase.`) +
          (d.tareasAntes > 0 ? ` Tes ${d.tareasAntes} tarefas que vencen antes.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `Alarma! «${d.titulo}» leva ${d.diasSinTocar} días sen revisar`,
      cuerpo: `A tarefa «${d.titulo}» non se tocou desde hai ${d.diasSinTocar} días. Revísaa canto antes.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} agarda a túa revisión`,
      cuerpo: `${d.nombre} rematou «${d.titulo}» e pediuche que a revises.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre} aprobou «${d.titulo}»`,
      cuerpo: `${d.nombre} revisou a tarefa e está ben.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre} devolveuche «${d.titulo}»`,
      cuerpo: d.comentario ?? 'Revisa a tarefa e volve marcala como feita.',
    }),
    periodos: {
      navidad: 'Vacacións de Nadal',
      'semana-santa': 'Vacacións de Semana Santa',
      verano: 'Vacacións de verán',
      hispanidad: 'Festa Nacional de España',
      inmaculada: 'Día da Inmaculada Concepción',
    },
    variosAvisos: (n) => `Tes ${n} avisos novos`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: ${n} tarefas levan días sen revisar`,
    asuntoVarios: (n) => `FocusFlow: tes ${n} recordatorios`,
    abrirApp: 'Abrir FocusFlow',
    pruebaPush: 'Os avisos funcionan neste dispositivo.',
  },
  eu: {
    revision: (d) => ({
      titulo: 'Etxeko lanen asteko berrikuspena',
      cuerpo: `${d.pendientes} zeregin dituzu egiteke: ${d.vencidas} epez kanpo eta ${d.proximos7Dias} hurrengo 7 egunetan amaitzen direnak.`,
    }),
    entrega: (d, fecha) => ({
      titulo: `Entrega ${d.horasRestantes} h barru: ${d.titulo}`,
      cuerpo: `«${d.titulo}» ${fecha} egunean amaitzen da. ${d.horasRestantes} ordu inguru geratzen dira.`,
    }),
    vacaciones: (d, nombre, inicio, fin) => {
      const unDia = d.inicio === d.fin;
      const cuando =
        d.diasRestantes === 0
          ? unDia
            ? 'gaur da'
            : 'gaur hasten dira'
          : unDia
            ? `${d.diasRestantes} egun barru`
            : `${d.diasRestantes} egun barru hasten dira`;
      return {
        titulo: `${nombre}: ${cuando}`,
        cuerpo:
          (unDia ? `${inicio} egunean ez dago eskolarik.` : `${inicio} egunetik ${fin} egunera ez dago eskolarik.`) +
          (d.tareasAntes > 0 ? ` Lehenago amaitzen diren ${d.tareasAntes} zeregin dituzu.` : ''),
      };
    },
    emergencia: (d) => ({
      titulo: `Alarma! «${d.titulo}» ${d.diasSinTocar} egun daramatza berrikusi gabe`,
      cuerpo: `«${d.titulo}» zeregina duela ${d.diasSinTocar} egun ez da ukitu. Berrikusi lehenbailehen.`,
    }),
    revisionSolicitada: (d) => ({
      titulo: `${d.nombre} zure berrikuspenaren zain dago`,
      cuerpo: `${d.nombre}(e)k «${d.titulo}» amaitu du eta berrikusteko eskatu dizu.`,
    }),
    revisionAprobada: (d) => ({
      titulo: `${d.nombre}(e)k «${d.titulo}» onartu du`,
      cuerpo: `${d.nombre}(e)k zeregina berrikusi du eta ondo dago.`,
    }),
    revisionDevuelta: (d) => ({
      titulo: `${d.nombre}(e)k «${d.titulo}» itzuli dizu`,
      cuerpo: d.comentario ?? 'Berrikusi zeregina eta markatu berriro eginda gisa.',
    }),
    periodos: {
      navidad: 'Gabonetako oporrak',
      'semana-santa': 'Aste Santuko oporrak',
      verano: 'Udako oporrak',
      hispanidad: 'Espainiako Jai Nazionala',
      inmaculada: 'Sortzez Garbiaren eguna',
    },
    variosAvisos: (n) => `${n} abisu berri dituzu`,
    asuntoEmergencias: (n) => `⚠️ FocusFlow: ${n} zeregin egunak daramatzate berrikusi gabe`,
    asuntoVarios: (n) => `FocusFlow: ${n} gogorarazpen dituzu`,
    abrirApp: 'Ireki FocusFlow',
    pruebaPush: 'Abisuak gailu honetan badabiltza.',
  },
};

export function textosIdioma(idioma: Idioma = 'es') {
  return TEXTOS[idioma];
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export function textoAviso(tipo: TipoAviso, datos: unknown, idioma: Idioma = 'es'): Texto {
  const t = TEXTOS[idioma];
  switch (tipo) {
    case 'REVISION_SEMANAL':
      return t.revision(datos as DatosRevision);
    case 'ENTREGA': {
      const d = datos as DatosEntrega;
      return t.entrega(d, formatearFecha(d.fechaLimite));
    }
    case 'VACACIONES': {
      const d = datos as DatosVacaciones;
      // El nombre de un día propio o de la fiesta de cada comunidad va tal cual.
      const nombre = t.periodos[d.clave] ?? d.nombre;
      return t.vacaciones(d, nombre, formatearFecha(d.inicio), formatearFecha(d.fin));
    }
    case 'EMERGENCIA':
      return t.emergencia(datos as DatosEmergencia);
    case 'REVISION_SOLICITADA':
      return t.revisionSolicitada(datos as DatosRevisionSolicitada);
    case 'REVISION_RESUELTA': {
      const d = datos as DatosRevisionResuelta;
      return d.decision === 'APROBADA' ? t.revisionAprobada(d) : t.revisionDevuelta(d);
    }
  }
}

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (caracter) => `&#${caracter.charCodeAt(0)};`);
}

export function asuntoCorreoAvisos(avisos: { tipo: TipoAviso; datos: unknown }[], idioma: Idioma = 'es') {
  const t = TEXTOS[idioma];
  const emergencias = avisos.filter((aviso) => aviso.tipo === 'EMERGENCIA').length;
  if (emergencias > 0) return t.asuntoEmergencias(emergencias);
  return avisos.length === 1
    ? `FocusFlow: ${textoAviso(avisos[0].tipo, avisos[0].datos, idioma).titulo}`
    : t.asuntoVarios(avisos.length);
}

export function htmlCorreoAvisos(
  avisos: { tipo: TipoAviso; datos: unknown; mensajeIa: string | null }[],
  enlaceApp: string,
  idioma: Idioma = 'es',
) {
  // Las alarmas de emergencia de una misma pasada comparten el texto de la IA:
  // se pone solo una vez.
  const textosIaPuestos = new Set<string>();
  const bloques = avisos.map((aviso) => {
    const { titulo, cuerpo } = textoAviso(aviso.tipo, aviso.datos, idioma);
    let ia = '';
    if (aviso.mensajeIa && !textosIaPuestos.has(aviso.mensajeIa)) {
      textosIaPuestos.add(aviso.mensajeIa);
      ia = `<p><em>${escaparHtml(aviso.mensajeIa)}</em></p>`;
    }
    return `<h3>${escaparHtml(titulo)}</h3><p>${escaparHtml(cuerpo)}</p>${ia}`;
  });
  return `${bloques.join('')}<p><a href="${enlaceApp}">${TEXTOS[idioma].abrirApp}</a></p>`;
}
