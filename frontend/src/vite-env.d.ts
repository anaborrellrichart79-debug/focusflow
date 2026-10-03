/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Identificador de la compilación (vite.config.ts).
declare const __VERSION_APP__: string;
