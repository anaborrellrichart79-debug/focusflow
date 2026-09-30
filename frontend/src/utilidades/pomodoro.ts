// Duraciones del Pomodoro en minutos. No es lo mismo concentrarse a los 7
// años que a los 16: cada cuenta usa la de su edad salvo que la ajuste.
export interface ConfigPomodoro {
  trabajo: number;
  descansoCorto: number;
  descansoLargo: number;
  // Cada cuántas vueltas de trabajo toca el descanso largo.
  ciclos: number;
}

export type ClavePreset = 'peques' | 'primaria' | 'secundaria' | 'clasico' | 'largo';

export const PRESETS_POMODORO: { clave: ClavePreset; config: ConfigPomodoro }[] = [
  { clave: 'peques', config: { trabajo: 5, descansoCorto: 1, descansoLargo: 5, ciclos: 3 } },
  { clave: 'primaria', config: { trabajo: 10, descansoCorto: 2, descansoLargo: 10, ciclos: 4 } },
  { clave: 'secundaria', config: { trabajo: 20, descansoCorto: 4, descansoLargo: 15, ciclos: 4 } },
  { clave: 'clasico', config: { trabajo: 25, descansoCorto: 5, descansoLargo: 20, ciclos: 4 } },
  { clave: 'largo', config: { trabajo: 45, descansoCorto: 10, descansoLargo: 25, ciclos: 3 } },
];

// Límites de cada campo: los mismos que valida el backend.
export const LIMITES_POMODORO: Record<keyof ConfigPomodoro, { min: number; max: number }> = {
  trabajo: { min: 5, max: 90 },
  descansoCorto: { min: 1, max: 30 },
  descansoLargo: { min: 1, max: 60 },
  ciclos: { min: 2, max: 8 },
};

export function presetPorEdad(edad: number | null | undefined): ClavePreset {
  if (edad == null) return 'clasico';
  if (edad <= 7) return 'peques';
  if (edad <= 11) return 'primaria';
  if (edad <= 15) return 'secundaria';
  return 'clasico';
}

export function configDePreset(clave: ClavePreset): ConfigPomodoro {
  return PRESETS_POMODORO.find((preset) => preset.clave === clave)!.config;
}

// La que usa la cuenta: la que haya guardado o, si no, la de su edad.
export function configEfectiva(
  guardada: ConfigPomodoro | null | undefined,
  edad: number | null | undefined,
): ConfigPomodoro {
  return guardada ?? configDePreset(presetPorEdad(edad));
}

// Qué preset coincide exactamente con una configuración (para marcarlo).
export function presetDe(config: ConfigPomodoro): ClavePreset | null {
  const encontrado = PRESETS_POMODORO.find(
    ({ config: c }) =>
      c.trabajo === config.trabajo &&
      c.descansoCorto === config.descansoCorto &&
      c.descansoLargo === config.descansoLargo &&
      c.ciclos === config.ciclos,
  );
  return encontrado?.clave ?? null;
}

export function limitarCampo(campo: keyof ConfigPomodoro, valor: number): number {
  const { min, max } = LIMITES_POMODORO[campo];
  if (!Number.isFinite(valor)) return min;
  return Math.min(max, Math.max(min, Math.round(valor)));
}
