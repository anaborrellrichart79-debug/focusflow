interface Tono {
  frecuencia: number;
  inicio: number; // segundos desde ahora
  duracion: number;
}

// Sonidos generados con Web Audio (sin ficheros de audio). El navegador solo
// deja sonar después de que el usuario haya interactuado con la página.
function reproducirTonos(tonos: Tono[], tipo: OscillatorType, volumen: number) {
  try {
    const ContextoAudio = window.AudioContext;
    const contexto = new ContextoAudio();
    const ahora = contexto.currentTime;

    tonos.forEach(({ frecuencia, inicio, duracion }) => {
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      const comienzo = ahora + inicio;

      oscilador.frequency.value = frecuencia;
      oscilador.type = tipo;
      ganancia.gain.setValueAtTime(0.0001, comienzo);
      ganancia.gain.exponentialRampToValueAtTime(volumen, comienzo + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, comienzo + duracion);

      oscilador.connect(ganancia).connect(contexto.destination);
      oscilador.start(comienzo);
      oscilador.stop(comienzo + duracion + 0.05);
    });

    const fin = Math.max(...tonos.map((tono) => tono.inicio + tono.duracion));
    setTimeout(() => contexto.close(), (fin + 0.5) * 1000);
  } catch {
    /* Web Audio no disponible en este navegador */
  }
}

export function reproducirAvisoFasePomodoro() {
  reproducirTonos(
    [
      { frecuencia: 880, inicio: 0, duracion: 0.35 },
      { frecuencia: 1320, inicio: 0.18, duracion: 0.35 },
    ],
    'sine',
    0.2,
  );
}

// Recordatorio normal: tres notas ascendentes, suaves.
export function reproducirAvisoRecordatorio() {
  reproducirTonos(
    [
      { frecuencia: 660, inicio: 0, duracion: 0.3 },
      { frecuencia: 880, inicio: 0.2, duracion: 0.3 },
      { frecuencia: 1100, inicio: 0.4, duracion: 0.45 },
    ],
    'sine',
    0.2,
  );
}

// Modo emergencia: alarma de dos tonos repetida, más fuerte y áspera (onda
// cuadrada), para que no pase desapercibida.
export function reproducirAlarmaEmergencia() {
  const tonos: Tono[] = [];
  for (let repeticion = 0; repeticion < 4; repeticion++) {
    tonos.push(
      { frecuencia: 960, inicio: repeticion * 0.5, duracion: 0.22 },
      { frecuencia: 720, inicio: repeticion * 0.5 + 0.25, duracion: 0.22 },
    );
  }
  reproducirTonos(tonos, 'square', 0.12);
}
