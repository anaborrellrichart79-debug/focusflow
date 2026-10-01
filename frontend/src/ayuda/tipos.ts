export type IdTemaAyuda =
  | 'primerosPasos'
  | 'tareas'
  | 'agenda'
  | 'horario'
  | 'planificador'
  | 'ia'
  | 'pomodoro'
  | 'revision'
  | 'familia'
  | 'ajustes';

export type IdVideoAyuda =
  | 'horarioFoto'
  | 'examenesFoto'
  | 'deberesFoto'
  | 'planEstudio'
  | 'agenda'
  | 'pomodoroEstadisticas'
  | 'familiaPedirRevision'
  | 'familiaRevisar'
  | 'idiomaTema'
  | 'movil';

export interface TemaAyuda {
  titulo: string;
  // Una frase: qué es y para qué sirve.
  resumen: string;
  // Cómo se usa, paso a paso o punto por punto.
  pasos: string[];
  consejo?: string;
}

export interface TextosAyuda {
  temas: Record<IdTemaAyuda, TemaAyuda>;
  // Qué se ve en cada vídeo: va debajo del vídeo y como su descripción
  // accesible (los vídeos no tienen sonido).
  videos: Record<IdVideoAyuda, string>;
}
