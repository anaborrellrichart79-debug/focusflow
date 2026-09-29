import { defineConfig } from '@playwright/test';
import { API_E2E, BASE_DATOS_E2E, WEB_E2E } from './e2e/entorno';

// Tests de extremo a extremo: la app completa (backend + frontend) contra una
// base de datos propia, focusflow_e2e, que se vacía al empezar. Nunca toca la
// base de datos de desarrollo ni los datos de la demo. Backend y frontend se
// arrancan aparte, en los puertos 3100 y 5174, así que pueden convivir con
// los de desarrollo (3000 y 5173). Hace falta Docker (Postgres) en marcha.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // Una sola ejecución a la vez: comparten base de datos y cada flujo crea
  // sus propias cuentas.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/preparar-base-de-datos.ts',
  use: {
    baseURL: WEB_E2E,
    // El Chrome instalado en el equipo: no hace falta descargar navegadores.
    channel: 'chrome',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // Compila en dist-e2e para no pisar el dist/ del backend de desarrollo.
      command:
        'pnpm exec prisma migrate deploy && pnpm exec tsc -p tsconfig.build.json --outDir dist-e2e && node dist-e2e/main.js',
      cwd: '../backend',
      url: API_E2E,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        PORT: '3100',
        DATABASE_URL: BASE_DATOS_E2E,
        FRONTEND_URL: WEB_E2E,
        // Sin servicios externos: ni IA, ni correo, ni push, ni Google.
        OLLAMA_URL: '',
        SMTP_HOST: '',
        VAPID_PUBLIC_KEY: '',
        VAPID_PRIVATE_KEY: '',
        GOOGLE_CLIENT_ID: '',
      },
    },
    {
      command: 'pnpm exec vite --port 5174 --strictPort',
      url: WEB_E2E,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_API_URL: API_E2E },
    },
  ],
});
