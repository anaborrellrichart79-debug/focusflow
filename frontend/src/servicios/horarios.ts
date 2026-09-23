import { peticionApi } from './api';

export type Etapa = 'PRIMARIA' | 'ESO' | 'BACHILLERATO';
export type CategoriaAsignatura = 'OBLIGATORIA' | 'DE_OPCION' | 'OPTATIVA' | 'AUTONOMICA';
export type TipoFranja = 'CLASE' | 'DESCANSO';
export type ComunidadAutonoma =
  | 'ANDALUCIA'
  | 'ARAGON'
  | 'ASTURIAS'
  | 'BALEARES'
  | 'CANARIAS'
  | 'CANTABRIA'
  | 'CASTILLA_LA_MANCHA'
  | 'CASTILLA_Y_LEON'
  | 'CATALUNA'
  | 'COMUNITAT_VALENCIANA'
  | 'EXTREMADURA'
  | 'GALICIA'
  | 'MADRID'
  | 'MURCIA'
  | 'NAVARRA'
  | 'PAIS_VASCO'
  | 'LA_RIOJA'
  | 'CEUTA'
  | 'MELILLA';

export interface Curso {
  id: string;
  etapa: Etapa;
  numero: number;
  nombre: string;
}

export interface Asignatura {
  id: string;
  nombre: string;
  categoria: CategoriaAsignatura;
  modalidad: string | null;
  comunidad: ComunidadAutonoma | null;
  cursoId: string;
  // null en las oficiales del catálogo; el id del usuario en sus optativas propias.
  usuarioId: string | null;
}

export interface FranjaHorario {
  id: string;
  orden: number;
  horaInicio: string;
  horaFin: string;
  tipo: TipoFranja;
  etiqueta: string | null;
}

export interface AsignaturaHorario {
  id: string;
  color: string;
  asignaturaId: string;
  asignatura: Asignatura;
}

export interface SesionClase {
  id: string;
  diaSemana: number;
  aula: string | null;
  franjaId: string;
  asignaturaHorarioId: string;
}

export interface HorarioResumen {
  id: string;
  titulo: string;
  periodo: string;
  activo: boolean;
  comunidad: ComunidadAutonoma;
  cursoId: string;
  curso: Curso;
}

export interface Horario extends HorarioResumen {
  franjas: FranjaHorario[];
  asignaturas: AsignaturaHorario[];
  sesiones: SesionClase[];
}

export interface DatosFranja {
  id?: string;
  horaInicio: string;
  horaFin: string;
  tipo: TipoFranja;
  etiqueta?: string;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function enviar<T>(token: string, ruta: string, method: string, cuerpo?: unknown) {
  return peticionApi<T>(ruta, {
    method,
    headers: cabeceras(token),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

export function listarCursos(token: string) {
  return peticionApi<Curso[]>('/cursos', { headers: cabeceras(token) });
}

export function listarAsignaturasCurso(token: string, cursoId: string, comunidad: ComunidadAutonoma) {
  return peticionApi<Asignatura[]>(`/cursos/${cursoId}/asignaturas?comunidad=${comunidad}`, {
    headers: cabeceras(token),
  });
}

export function crearOptativaPropia(token: string, datos: { nombre: string; cursoId: string }) {
  return enviar<Asignatura>(token, '/asignaturas', 'POST', datos);
}

export function listarHorarios(token: string) {
  return peticionApi<HorarioResumen[]>('/horarios', { headers: cabeceras(token) });
}

// null si el usuario todavía no tiene ningún horario.
export function obtenerHorarioActivo(token: string) {
  return peticionApi<Horario | null>('/horarios/activo', { headers: cabeceras(token) });
}

export function crearHorario(
  token: string,
  datos: { titulo: string; periodo: string; cursoId: string; comunidad: ComunidadAutonoma },
) {
  return enviar<Horario>(token, '/horarios', 'POST', datos);
}

export function actualizarHorario(
  token: string,
  id: string,
  datos: Partial<{ titulo: string; periodo: string; comunidad: ComunidadAutonoma; activo: boolean }>,
) {
  return enviar<Horario>(token, `/horarios/${id}`, 'PATCH', datos);
}

export function eliminarHorario(token: string, id: string) {
  return enviar<void>(token, `/horarios/${id}`, 'DELETE');
}

export function reemplazarFranjas(token: string, id: string, franjas: DatosFranja[]) {
  return enviar<Horario>(token, `/horarios/${id}/franjas`, 'PUT', { franjas });
}

export function anadirAsignaturaHorario(token: string, id: string, asignaturaId: string) {
  return enviar<Horario>(token, `/horarios/${id}/asignaturas`, 'POST', { asignaturaId });
}

export function cambiarColorAsignaturaHorario(
  token: string,
  id: string,
  asignaturaHorarioId: string,
  color: string,
) {
  return enviar<Horario>(token, `/horarios/${id}/asignaturas/${asignaturaHorarioId}`, 'PATCH', {
    color,
  });
}

export function quitarAsignaturaHorario(token: string, id: string, asignaturaHorarioId: string) {
  return enviar<Horario>(token, `/horarios/${id}/asignaturas/${asignaturaHorarioId}`, 'DELETE');
}

export function asignarSesion(
  token: string,
  id: string,
  datos: { franjaId: string; diaSemana: number; asignaturaHorarioId: string | null; aula?: string },
) {
  return enviar<Horario>(token, `/horarios/${id}/sesiones`, 'PUT', datos);
}
