import { peticionApi } from './api';
import type { ComunidadAutonoma } from './horarios';

export type TipoRecordatorio = 'REVISION_SEMANAL' | 'ENTREGA' | 'VACACIONES';
export type TipoAviso = TipoRecordatorio | 'EMERGENCIA' | 'REVISION_SOLICITADA' | 'REVISION_RESUELTA';

export interface Recordatorio {
  id: string;
  tipo: TipoRecordatorio;
  activo: boolean;
  diaSemana: number | null; // 0 = domingo ... 6 = sábado
  hora: string | null;
  horasAntes: number | null;
  diasAntes: number | null;
  soloEscolar: boolean;
  porCorreo: boolean;
}

export interface ConfiguracionEmergencia {
  activa: boolean;
  dias: number;
  porCorreo: boolean;
}

export interface ConfiguracionRecordatorios {
  recordatorios: Recordatorio[];
  emergencia: ConfiguracionEmergencia;
  correoDisponible: boolean;
  iaDisponible: boolean;
}

export interface NuevoRecordatorio {
  tipo: TipoRecordatorio;
  diaSemana?: number;
  hora?: string;
  horasAntes?: number;
  diasAntes?: number;
  soloEscolar?: boolean;
  porCorreo?: boolean;
}

export type CambiosRecordatorio = Partial<Omit<Recordatorio, 'id' | 'tipo'>>;

// "datos" depende del tipo (ver textos-aviso.ts en el backend).
export interface DatosAvisoRevision {
  pendientes: number;
  vencidas: number;
  proximos7Dias: number;
  titulos: string[];
}

export interface DatosAvisoEntrega {
  titulo: string;
  fechaLimite: string;
  horasRestantes: number;
}

export interface DatosAvisoVacaciones {
  clave: string;
  nombre: string;
  inicio: string;
  fin: string;
  diasRestantes: number;
  tareasAntes: number;
}

export interface DatosAvisoEmergencia {
  titulo: string;
  diasSinTocar: number;
}

// Revisión familiar: "nombre" es el de la otra persona.
export interface DatosAvisoRevisionSolicitada {
  titulo: string;
  nombre: string;
}

export interface DatosAvisoRevisionResuelta {
  titulo: string;
  nombre: string;
  decision: 'APROBADA' | 'DEVUELTA';
  comentario: string | null;
}

interface AvisoBase {
  id: string;
  mensajeIa: string | null;
  mostradoEn: string | null;
  leidoEn: string | null;
  correoEnviadoEn: string | null;
  tareaId: string | null;
  creadoEn: string;
}

export type Aviso = AvisoBase &
  (
    | { tipo: 'REVISION_SEMANAL'; datos: DatosAvisoRevision }
    | { tipo: 'ENTREGA'; datos: DatosAvisoEntrega }
    | { tipo: 'VACACIONES'; datos: DatosAvisoVacaciones }
    | { tipo: 'EMERGENCIA'; datos: DatosAvisoEmergencia }
    | { tipo: 'REVISION_SOLICITADA'; datos: DatosAvisoRevisionSolicitada }
    | { tipo: 'REVISION_RESUELTA'; datos: DatosAvisoRevisionResuelta }
  );

export interface PeriodoNoLectivo {
  clave: string;
  nombre: string;
  inicio: string; // YYYY-MM-DD
  fin: string;
}

export interface DiaNoLectivoPropio {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
}

export interface CalendarioEscolar {
  curso: string;
  comunidad: ComunidadAutonoma | null;
  inicioClases: string | null;
  finClases: string | null;
  periodos: PeriodoNoLectivo[];
  propios: DiaNoLectivoPropio[];
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function obtenerConfiguracionRecordatorios(token: string) {
  return peticionApi<ConfiguracionRecordatorios>('/recordatorios', { headers: cabeceras(token) });
}

export function crearRecordatorio(token: string, datos: NuevoRecordatorio) {
  return peticionApi<Recordatorio>('/recordatorios', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function actualizarRecordatorio(token: string, id: string, cambios: CambiosRecordatorio) {
  return peticionApi<Recordatorio>(`/recordatorios/${id}`, {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(cambios),
  });
}

export function eliminarRecordatorio(token: string, id: string) {
  return peticionApi<void>(`/recordatorios/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}

export function actualizarEmergencia(token: string, cambios: Partial<ConfiguracionEmergencia>) {
  return peticionApi<ConfiguracionEmergencia>('/recordatorios/emergencia', {
    method: 'PATCH',
    headers: cabeceras(token),
    body: JSON.stringify(cambios),
  });
}

export function comprobarRecordatorios(token: string) {
  return peticionApi<{ creados: number }>('/recordatorios/comprobar', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function obtenerAvisos(token: string) {
  return peticionApi<Aviso[]>('/avisos', { headers: cabeceras(token) });
}

export function marcarAvisosMostrados(token: string, ids: string[]) {
  return peticionApi<void>('/avisos/mostrados', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify({ ids }),
  });
}

export function marcarAvisoLeido(token: string, id: string) {
  return peticionApi<void>(`/avisos/${id}/leido`, {
    method: 'PATCH',
    headers: cabeceras(token),
  });
}

export function marcarTodosLosAvisosLeidos(token: string) {
  return peticionApi<void>('/avisos/leer-todos', {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function marcarTareaRevisada(token: string, tareaId: string) {
  return peticionApi<void>(`/avisos/tareas/${tareaId}/revisada`, {
    method: 'POST',
    headers: cabeceras(token),
  });
}

export function obtenerCalendarioEscolar(token: string) {
  return peticionApi<CalendarioEscolar>('/calendario-escolar', { headers: cabeceras(token) });
}

export function crearDiaNoLectivo(token: string, datos: Omit<DiaNoLectivoPropio, 'id'>) {
  return peticionApi<DiaNoLectivoPropio>('/calendario-escolar/propios', {
    method: 'POST',
    headers: cabeceras(token),
    body: JSON.stringify(datos),
  });
}

export function eliminarDiaNoLectivo(token: string, id: string) {
  return peticionApi<void>(`/calendario-escolar/propios/${id}`, {
    method: 'DELETE',
    headers: cabeceras(token),
  });
}
