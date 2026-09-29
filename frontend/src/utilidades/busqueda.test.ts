import { describe, expect, it } from 'vitest';
import type { Etiqueta } from '@/servicios/etiquetas';
import type { Nota } from '@/servicios/notas';
import type { Objetivo } from '@/servicios/objetivos';
import type { Tarea } from '@/servicios/tareas';
import { buscar, extracto, normalizar } from './busqueda';

function tarea(datos: Partial<Tarea>): Tarea {
  return { id: 't', titulo: '', descripcion: null, subtareas: [], etiquetas: [], ...datos } as Tarea;
}

const VACIO = { tareas: [], objetivos: [], notas: [], etiquetas: [] };

describe('búsqueda global', () => {
  it('normaliza sin tildes ni mayúsculas', () => {
    expect(normalizar('Matemáticas ÑANDÚ')).toBe('matematicas nandu');
  });

  it('con menos de 2 letras no busca', () => {
    const resultado = buscar(' m ', { ...VACIO, tareas: [tarea({ titulo: 'Mates' })] });
    expect(resultado.total).toBe(0);
  });

  it('encuentra tareas sin importar tildes y exige todas las palabras', () => {
    const tareas = [
      tarea({ id: 'a', titulo: 'Examen de Matemáticas' }),
      tarea({ id: 'b', titulo: 'Deberes de matemáticas' }),
    ];
    expect(buscar('matematicas', { ...VACIO, tareas }).tareas.map((r) => r.tarea.id)).toEqual(['a', 'b']);
    expect(buscar('examen matem', { ...VACIO, tareas }).tareas.map((r) => r.tarea.id)).toEqual(['a']);
  });

  it('dice de dónde sale la coincidencia si no está en el título, y pone primero las de título', () => {
    const tareas = [
      tarea({
        id: 'sub',
        titulo: 'Trabajo de ciencias',
        subtareas: [{ id: 's', titulo: 'Buscar fotos del volcán' }] as Tarea['subtareas'],
      }),
      tarea({ id: 'desc', titulo: 'Excursión', descripcion: 'Llevar la ficha del volcán' }),
      tarea({ id: 'titulo', titulo: 'Maqueta del volcán' }),
    ];

    const resultado = buscar('volcan', { ...VACIO, tareas }).tareas;

    expect(resultado[0].tarea.id).toBe('titulo');
    expect(resultado.find((r) => r.tarea.id === 'sub')?.subtarea).toBe('Buscar fotos del volcán');
    expect(resultado.find((r) => r.tarea.id === 'desc')?.descripcion).toBe('Llevar la ficha del volcán');
  });

  it('busca en objetivos, notas y etiquetas (también por la etiqueta madre)', () => {
    const etiquetas = [
      { id: 'e1', nombre: 'Estudio', padreId: null },
      { id: 'e2', nombre: 'Matemáticas', padreId: 'e1' },
      { id: 'e3', nombre: 'Casa', padreId: null },
    ] as Etiqueta[];
    const resultado = buscar('estudio', {
      tareas: [],
      objetivos: [{ id: 'o', titulo: 'Aprobar', descripcion: 'Rutina de estudio diaria' } as Objetivo],
      notas: [{ id: 'n', contenido: 'Horario de estudio del sábado' } as Nota],
      etiquetas,
    });

    expect(resultado.objetivos.map((o) => o.id)).toEqual(['o']);
    expect(resultado.notas.map((n) => n.id)).toEqual(['n']);
    expect(resultado.etiquetas.map((e) => e.ruta)).toEqual(['Estudio', 'Estudio › Matemáticas']);
    expect(resultado.total).toBe(4);
  });

  it('recorta los textos largos alrededor de lo encontrado', () => {
    const largo = `${'relleno '.repeat(20)}la palabra clave está aquí ${'más texto '.repeat(20)}`;
    const trozo = extracto(largo, 'clave');
    expect(trozo).toContain('clave');
    expect(trozo.startsWith('…')).toBe(true);
    expect(trozo.endsWith('…')).toBe(true);
  });
});
