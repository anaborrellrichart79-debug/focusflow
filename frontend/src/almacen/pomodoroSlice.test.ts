import { describe, expect, it } from 'vitest';
import reductor, {
  DURACION_DESCANSO_CORTO_SEGUNDOS,
  DURACION_DESCANSO_LARGO_SEGUNDOS,
  DURACION_TRABAJO_SEGUNDOS,
  iniciar,
  notificacionMostrada,
  pausar,
  reiniciarFase,
  tick,
} from './pomodoroSlice';

describe('pomodoroSlice', () => {
  it('empieza en fase de trabajo, inactivo y sin ciclos completados', () => {
    const estado = reductor(undefined, { type: '@@INIT' });
    expect(estado).toEqual({
      fase: 'trabajo',
      segundosRestantes: DURACION_TRABAJO_SEGUNDOS,
      activo: false,
      ciclosCompletados: 0,
      notificacionPendiente: false,
    });
  });

  it('iniciar activa el temporizador y pausar lo desactiva', () => {
    let estado = reductor(undefined, iniciar());
    expect(estado.activo).toBe(true);

    estado = reductor(estado, pausar());
    expect(estado.activo).toBe(false);
  });

  it('tick no descuenta segundos si el temporizador está pausado', () => {
    const estado = reductor(undefined, tick());
    expect(estado.segundosRestantes).toBe(DURACION_TRABAJO_SEGUNDOS);
  });

  it('tick descuenta un segundo cuando está activo', () => {
    let estado = reductor(undefined, iniciar());
    estado = reductor(estado, tick());
    expect(estado.segundosRestantes).toBe(DURACION_TRABAJO_SEGUNDOS - 1);
  });

  it('al agotar el trabajo pasa a descanso corto y marca notificación pendiente', () => {
    let estado = reductor(undefined, iniciar());
    estado = { ...estado, segundosRestantes: 0 };

    estado = reductor(estado, tick());

    expect(estado.fase).toBe('descansoCorto');
    expect(estado.segundosRestantes).toBe(DURACION_DESCANSO_CORTO_SEGUNDOS);
    expect(estado.ciclosCompletados).toBe(1);
    expect(estado.notificacionPendiente).toBe(true);
  });

  it('cada 4º ciclo de trabajo pasa a descanso largo en vez de corto', () => {
    let estado = reductor(undefined, iniciar());
    estado = { ...estado, segundosRestantes: 0, ciclosCompletados: 3 };

    estado = reductor(estado, tick());

    expect(estado.fase).toBe('descansoLargo');
    expect(estado.segundosRestantes).toBe(DURACION_DESCANSO_LARGO_SEGUNDOS);
    expect(estado.ciclosCompletados).toBe(4);
  });

  it('al agotar un descanso vuelve a la fase de trabajo', () => {
    let estado = reductor(undefined, iniciar());
    estado = { ...estado, fase: 'descansoCorto', segundosRestantes: 0 };

    estado = reductor(estado, tick());

    expect(estado.fase).toBe('trabajo');
    expect(estado.segundosRestantes).toBe(DURACION_TRABAJO_SEGUNDOS);
  });

  it('reiniciarFase pausa y repone la duración completa de la fase actual', () => {
    let estado = reductor(undefined, iniciar());
    estado = { ...estado, fase: 'descansoLargo', segundosRestantes: 12 };

    estado = reductor(estado, reiniciarFase());

    expect(estado.activo).toBe(false);
    expect(estado.segundosRestantes).toBe(DURACION_DESCANSO_LARGO_SEGUNDOS);
  });

  it('notificacionMostrada limpia el aviso pendiente', () => {
    let estado = reductor(undefined, iniciar());
    estado = { ...estado, notificacionPendiente: true };

    estado = reductor(estado, notificacionMostrada());

    expect(estado.notificacionPendiente).toBe(false);
  });
});
