import type { Asignatura, Curso, Horario } from '@/servicios/horarios';

export const CURSO_TERCERO_PRIMARIA: Curso = {
  id: 'primaria-3',
  etapa: 'PRIMARIA',
  numero: 3,
  nombre: '3º de Primaria',
};

function asignaturaOficial(slug: string, nombre: string, extra: Partial<Asignatura> = {}): Asignatura {
  return {
    id: `primaria-3-${slug}`,
    nombre,
    categoria: 'OBLIGATORIA',
    modalidad: null,
    comunidad: null,
    cursoId: 'primaria-3',
    usuarioId: null,
    ...extra,
  };
}

export const MATEMATICAS = asignaturaOficial('matematicas', 'Matemáticas');
export const LENGUA = asignaturaOficial('lengua-castellana-y-literatura', 'Lengua Castellana y Literatura');
export const VALENCIANO = asignaturaOficial('comunitat-valenciana-valenciano', 'Valenciano: Lengua y Literatura', {
  categoria: 'AUTONOMICA',
  comunidad: 'COMUNITAT_VALENCIANA',
});

// Horario parecido al de la imagen de referencia: dos clases, un recreo y
// Matemáticas el lunes a primera hora.
export function crearHorarioFalso(datos: Partial<Horario> = {}): Horario {
  return {
    id: 'horario-1',
    titulo: '3º B',
    periodo: '26/27',
    activo: true,
    comunidad: 'COMUNITAT_VALENCIANA',
    cursoId: 'primaria-3',
    curso: CURSO_TERCERO_PRIMARIA,
    franjas: [
      { id: 'franja-1', orden: 0, horaInicio: '08:30', horaFin: '09:30', tipo: 'CLASE', etiqueta: null },
      { id: 'franja-2', orden: 1, horaInicio: '09:30', horaFin: '10:30', tipo: 'CLASE', etiqueta: null },
      { id: 'franja-3', orden: 2, horaInicio: '10:30', horaFin: '11:00', tipo: 'DESCANSO', etiqueta: 'Recreo' },
    ],
    asignaturas: [
      { id: 'ah-mates', color: '#3B82F6', asignaturaId: MATEMATICAS.id, asignatura: MATEMATICAS },
      { id: 'ah-lengua', color: '#FACC15', asignaturaId: LENGUA.id, asignatura: LENGUA },
    ],
    sesiones: [
      { id: 's-1', diaSemana: 1, aula: '12', franjaId: 'franja-1', asignaturaHorarioId: 'ah-mates' },
    ],
    ...datos,
  };
}
