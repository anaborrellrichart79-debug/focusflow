import { describe, expect, it } from 'vitest';
import { IDIOMAS_DISPONIBLES, mensajesPorIdioma } from '@/idiomas';
import { ARCHIVO_VIDEO, portadaDe, TEMAS_AYUDA, TEXTOS_AYUDA, temaDeRuta, type IdVideoAyuda } from '.';

describe('contenidos de la ayuda', () => {
  it('cada idioma tiene todos los temas con los mismos puntos que el castellano', () => {
    for (const { codigo } of IDIOMAS_DISPONIBLES) {
      for (const { id } of TEMAS_AYUDA) {
        const tema = TEXTOS_AYUDA[codigo].temas[id];
        const referencia = TEXTOS_AYUDA.es.temas[id];
        expect(tema.titulo, `${codigo} ${id}`).not.toBe('');
        expect(tema.pasos, `${codigo} ${id}`).toHaveLength(referencia.pasos.length);
        expect(Boolean(tema.consejo), `${codigo} ${id}`).toBe(Boolean(referencia.consejo));
      }
    }
  });

  it('los textos de los botones de la ayuda están en todos los idiomas', () => {
    const claves = ['nav.ayuda', 'ayuda.titulo', 'ayuda.intro', 'ayuda.indice', 'ayuda.boton', 'ayuda.verTodo', 'ayuda.notaVideos'];
    for (const { codigo } of IDIOMAS_DISPONIBLES) {
      for (const clave of claves) expect(mensajesPorIdioma[codigo][clave], `${codigo} ${clave}`).toBeTruthy();
    }
  });

  it('cada vídeo y su portada existen en public/media/ayuda, fuera de la ruta de la página /ayuda', () => {
    // Sin importarlos: solo la lista de ficheros que hay en la carpeta.
    const enDisco = Object.keys(import.meta.glob('/public/media/ayuda/*.{webm,jpg}')).map((ruta) =>
      ruta.replace('/public', ''),
    );
    expect(Object.values(ARCHIVO_VIDEO).every((archivo) => !archivo.startsWith('/ayuda/'))).toBe(true);
    for (const video of Object.keys(ARCHIVO_VIDEO) as IdVideoAyuda[]) {
      expect(enDisco).toContain(ARCHIVO_VIDEO[video]);
      expect(enDisco).toContain(portadaDe(video));
    }
  });

  it('cada pantalla abre su tema, y una pantalla sin tema propio no abre ninguno', () => {
    expect(temaDeRuta('/kanban')).toBe('tareas');
    expect(temaDeRuta('/planificador')).toBe('planificador');
    expect(temaDeRuta('/estadisticas')).toBe('pomodoro');
    expect(temaDeRuta('/no-existe')).toBeNull();
  });
});
