export function reproducirAvisoFasePomodoro() {
  try {
    const ContextoAudio = window.AudioContext;
    const contexto = new ContextoAudio();
    const ahora = contexto.currentTime;

    [880, 1320].forEach((frecuencia, indice) => {
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      const inicio = ahora + indice * 0.18;

      oscilador.frequency.value = frecuencia;
      oscilador.type = 'sine';
      ganancia.gain.setValueAtTime(0.0001, inicio);
      ganancia.gain.exponentialRampToValueAtTime(0.2, inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.35);

      oscilador.connect(ganancia).connect(contexto.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.4);
    });

    setTimeout(() => contexto.close(), 1000);
  } catch {
    /* Web Audio no disponible en este navegador */
  }
}
