import { peticionApi } from './api';
import type { TipoFranja } from './horarios';
import type { TipoEscolar } from './tareas';

// Lo que la IA ha leído en la foto: una propuesta para revisar, no se guarda
// nada hasta que el usuario la acepta.
export interface FranjaLeida {
  horaInicio: string;
  horaFin: string;
  tipo: TipoFranja;
  etiqueta: string;
  clases: { diaSemana: number; asignaturaId: string; nombre: string }[];
}

export interface EntregaLeida {
  fecha: string; // YYYY-MM-DD
  titulo: string;
  tipo: TipoEscolar;
  asignaturaHorarioId: string | null;
}

function subir<T>(token: string, ruta: string, foto: Blob) {
  const formulario = new FormData();
  formulario.append('foto', foto, 'foto.jpg');
  return peticionApi<T>(ruta, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formulario,
  });
}

export function leerHorarioDeFoto(token: string, horarioId: string, foto: Blob) {
  return subir<{ franjas: FranjaLeida[] }>(token, `/ia/fotos/horario/${horarioId}`, foto);
}

export function leerEntregasDeFoto(token: string, foto: Blob) {
  return subir<{ entregas: EntregaLeida[] }>(token, '/ia/fotos/entregas', foto);
}
